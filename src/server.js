require('dotenv').config();
const express=require('express');
const cors=require('cors');
const pool=require('./db');
const auth=require('./routes/auth');
const materiales=require('./routes/materiales');
const prestamos=require('./routes/prestamos');
const notFound=require('./middleware/notFound');
const errorHandler=require('./middleware/errorHandler');
const app=express();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Configura JWT_SECRET con al menos 32 caracteres antes de iniciar la API.');
}
app.use(cors());
app.use(express.json({limit:'1mb'}));
app.get('/',(req,res)=>{
  res.json({
    servicio:'Lab Química API',
    estado:'activo',
    health:'/api/health',
    documentacion:'Consulta la colección Postman para ver los endpoints disponibles.'
  });
});
app.get('/api/health',async(req,res,next)=>{
  try{await pool.query('SELECT 1');res.json({estado:'OK',servicio:'Lab Química API',base_datos:'conectada'});}
  catch(e){next(e);}
});
app.use('/api/auth',auth);
app.use('/api/materiales',materiales);
app.use('/api/prestamos',prestamos);
app.use(notFound);
app.use(errorHandler);
const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log(`Lab Química API escuchando en el puerto ${port}`));
