const express=require('express');
const pool=require('../db');
const router=express.Router();
const estados=['ACTIVO','DEVUELTO'];

router.get('/',async(req,res,next)=>{
  try{
    const {estado,materialId,responsable}=req.query,where=[],params=[];
    if(estado){const e=String(estado).toUpperCase();if(!estados.includes(e))return res.status(400).json({error:'estado debe ser ACTIVO o DEVUELTO.'});where.push('p.estado=?');params.push(e);}
    if(materialId!==undefined){const id=Number(materialId);if(!Number.isInteger(id)||id<1)return res.status(400).json({error:'materialId inválido.'});where.push('p.material_id=?');params.push(id);}
    if(responsable){where.push('p.responsable LIKE ?');params.push(`%${responsable}%`);}
    const [rows]=await pool.execute(`SELECT p.*,m.nombre AS material_nombre,m.categoria AS material_categoria FROM prestamos p JOIN materiales m ON m.id=p.material_id ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY p.id DESC`,params);
    res.json({total:rows.length,datos:rows});
  }catch(e){next(e);}
});
router.get('/:id',async(req,res,next)=>{
  try{
    const id=Number(req.params.id);if(!Number.isInteger(id)||id<1)return res.status(400).json({error:'ID inválido.'});
    const [r]=await pool.execute('SELECT p.*,m.nombre AS material_nombre,m.categoria AS material_categoria FROM prestamos p JOIN materiales m ON m.id=p.material_id WHERE p.id=?',[id]);
    if(!r.length)return res.status(404).json({error:'Préstamo no encontrado.'});res.json(r[0]);
  }catch(e){next(e);}
});
router.post('/',async(req,res,next)=>{
  const {material_id,responsable,cantidad,fecha_prevista_devolucion,observaciones=null}=req.body;
  const errors=[];
  if(!Number.isInteger(material_id)||material_id<1)errors.push('material_id debe ser entero positivo.');
  if(typeof responsable!=='string'||!responsable.trim())errors.push('responsable es obligatorio.');
  if(!Number.isInteger(cantidad)||cantidad<1)errors.push('cantidad debe ser entero mayor que 0.');
  if(typeof fecha_prevista_devolucion!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(fecha_prevista_devolucion))errors.push('fecha_prevista_devolucion debe usar YYYY-MM-DD.');
  if(errors.length)return res.status(400).json({error:'Datos inválidos.',detalles:errors});
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    const [m]=await conn.execute('SELECT * FROM materiales WHERE id=? FOR UPDATE',[material_id]);
    if(!m.length){await conn.rollback();return res.status(404).json({error:'Material no encontrado.'});}
    if(m[0].estado!=='ACTIVO'){await conn.rollback();return res.status(409).json({error:'No se puede prestar un material inactivo.'});}
    if(cantidad>m[0].cantidad_disponible){await conn.rollback();return res.status(409).json({error:'Cantidad no disponible.',cantidad_solicitada:cantidad,cantidad_disponible:m[0].cantidad_disponible});}
    const [r]=await conn.execute('INSERT INTO prestamos(material_id,responsable,cantidad,fecha_prevista_devolucion,observaciones) VALUES(?,?,?,?,?)',
      [material_id,responsable.trim(),cantidad,fecha_prevista_devolucion,observaciones]);
    await conn.execute('UPDATE materiales SET cantidad_disponible=cantidad_disponible-? WHERE id=?',[cantidad,material_id]);
    const [created]=await conn.execute('SELECT * FROM prestamos WHERE id=?',[r.insertId]);
    await conn.commit();res.status(201).json({mensaje:'Préstamo registrado correctamente.',datos:created[0]});
  }catch(e){await conn.rollback().catch(()=>{});next(e);}finally{conn.release();}
});
router.patch('/:id/devolver',async(req,res,next)=>{
  const conn=await pool.getConnection();
  try{
    const id=Number(req.params.id);if(!Number.isInteger(id)||id<1)return res.status(400).json({error:'ID inválido.'});
    await conn.beginTransaction();
    const [r]=await conn.execute('SELECT * FROM prestamos WHERE id=? FOR UPDATE',[id]);
    if(!r.length){await conn.rollback();return res.status(404).json({error:'Préstamo no encontrado.'});}
    const p=r[0];if(p.estado==='DEVUELTO'){await conn.rollback();return res.status(409).json({error:'Este préstamo ya fue devuelto.'});}
    await conn.execute("UPDATE prestamos SET estado='DEVUELTO',fecha_devolucion=CURRENT_TIMESTAMP WHERE id=?",[id]);
    await conn.execute('UPDATE materiales SET cantidad_disponible=cantidad_disponible+? WHERE id=?',[p.cantidad,p.material_id]);
    const [updated]=await conn.execute('SELECT * FROM prestamos WHERE id=?',[id]);await conn.commit();
    res.json({mensaje:'Devolución registrada correctamente.',datos:updated[0]});
  }catch(e){await conn.rollback().catch(()=>{});next(e);}finally{conn.release();}
});
module.exports=router;
