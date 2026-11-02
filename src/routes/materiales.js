const express = require('express');
const pool = require('../db');
const router = express.Router();
const estados = ['ACTIVO','INACTIVO'];

function validar(b) {
  const e=[];
  if(typeof b.nombre!=='string'||!b.nombre.trim()) e.push('nombre es obligatorio.');
  if(typeof b.categoria!=='string'||!b.categoria.trim()) e.push('categoria es obligatoria.');
  if(!Number.isInteger(b.cantidad_total)||b.cantidad_total<0) e.push('cantidad_total debe ser entero mayor o igual a 0.');
  if(b.estado!==undefined&&!estados.includes(b.estado)) e.push('estado debe ser ACTIVO o INACTIVO.');
  if(b.descripcion!==undefined&&b.descripcion!==null&&typeof b.descripcion!=='string') e.push('descripcion debe ser texto.');
  return e;
}

// GET /api/materiales?q=vaso&categoria=VIDRIERIA&estado=ACTIVO
router.get('/',async(req,res,next)=>{
  try {
    const {q,categoria,estado}=req.query, where=[], params=[];
    if(q){where.push('(nombre LIKE ? OR descripcion LIKE ?)');params.push(`%${q}%`,`%${q}%`);}
    if(categoria){where.push('UPPER(categoria)=UPPER(?)');params.push(categoria);}
    if(estado){if(!estados.includes(String(estado).toUpperCase()))return res.status(400).json({error:'estado debe ser ACTIVO o INACTIVO.'});where.push('estado=?');params.push(String(estado).toUpperCase());}
    const [rows]=await pool.execute(`SELECT * FROM materiales ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY nombre`,params);
    res.json({total:rows.length,datos:rows});
  }catch(e){next(e);}
});
router.get('/:id',async(req,res,next)=>{
  try{
    const id=Number(req.params.id); if(!Number.isInteger(id)||id<1)return res.status(400).json({error:'ID inválido.'});
    const [r]=await pool.execute('SELECT * FROM materiales WHERE id=?',[id]);
    if(!r.length)return res.status(404).json({error:'Material no encontrado.'});res.json(r[0]);
  }catch(e){next(e);}
});
router.post('/',async(req,res,next)=>{
  try{
    const errors=validar(req.body);if(errors.length)return res.status(400).json({error:'Datos inválidos.',detalles:errors});
    const {nombre,categoria,descripcion=null,cantidad_total,estado='ACTIVO'}=req.body;
    const [r]=await pool.execute('INSERT INTO materiales(nombre,categoria,descripcion,cantidad_total,cantidad_disponible,estado) VALUES(?,?,?,?,?,?)',
      [nombre.trim(),categoria.trim().toUpperCase(),descripcion,cantidad_total,cantidad_total,estado]);
    const [rows]=await pool.execute('SELECT * FROM materiales WHERE id=?',[r.insertId]);
    res.status(201).json({mensaje:'Material creado correctamente.',datos:rows[0]});
  }catch(e){next(e);}
});
router.put('/:id',async(req,res,next)=>{
  const conn=await pool.getConnection();
  try{
    const id=Number(req.params.id);if(!Number.isInteger(id)||id<1)return res.status(400).json({error:'ID inválido.'});
    const errors=validar(req.body);if(errors.length)return res.status(400).json({error:'Datos inválidos.',detalles:errors});
    await conn.beginTransaction();
    const [rows]=await conn.execute('SELECT * FROM materiales WHERE id=? FOR UPDATE',[id]);
    if(!rows.length){await conn.rollback();return res.status(404).json({error:'Material no encontrado.'});}
    const old=rows[0], borrowed=old.cantidad_total-old.cantidad_disponible, total=req.body.cantidad_total;
    if(total<borrowed){await conn.rollback();return res.status(409).json({error:'La cantidad total no puede ser menor que las unidades prestadas.',unidades_prestadas:borrowed});}
    await conn.execute('UPDATE materiales SET nombre=?,categoria=?,descripcion=?,cantidad_total=?,cantidad_disponible=?,estado=? WHERE id=?',
      [req.body.nombre.trim(),req.body.categoria.trim().toUpperCase(),req.body.descripcion??null,total,total-borrowed,req.body.estado||old.estado,id]);
    const [updated]=await conn.execute('SELECT * FROM materiales WHERE id=?',[id]);await conn.commit();
    res.json({mensaje:'Material actualizado correctamente.',datos:updated[0]});
  }catch(e){await conn.rollback().catch(()=>{});next(e);}finally{conn.release();}
});
// DELETE aplica baja lógica para conservar el historial de préstamos.
router.delete('/:id',async(req,res,next)=>{
  try{
    const id=Number(req.params.id);if(!Number.isInteger(id)||id<1)return res.status(400).json({error:'ID inválido.'});
    const [r]=await pool.execute('SELECT id FROM materiales WHERE id=?',[id]);
    if(!r.length)return res.status(404).json({error:'Material no encontrado.'});
    await pool.execute("UPDATE materiales SET estado='INACTIVO' WHERE id=?",[id]);
    res.json({mensaje:'Material desactivado. Se conserva el historial de préstamos.'});
  }catch(e){next(e);}
});
module.exports=router;
