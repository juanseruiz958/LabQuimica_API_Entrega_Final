require('dotenv').config();
const express=require('express');
const cors=require('cors');
const pool=require('./db');
const materiales=require('./routes/materiales');
const prestamos=require('./routes/prestamos');
const notFound=require('./middleware/notFound');
const errorHandler=require('./middleware/errorHandler');
const app=express();
app.use(cors());
app.use(express.json({limit:'1mb'}));
app.get('/api/health',async(req,res,next)=>{
  try{await pool.query('SELECT 1');res.json({estado:'OK',servicio:'Lab Química API',base_datos:'conectada'});}
  catch(e){next(e);}
});
app.use('/api/materiales',materiales);
app.use('/api/prestamos',prestamos);
app.use(notFound);
app.use(errorHandler);
const port=Number(process.env.PORT||3000);
app.listen(port,()=>console.log(`Lab Química API escuchando en http://localhost:${port}`));
