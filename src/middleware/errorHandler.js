module.exports = (err,req,res,next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({error:'Conflicto con un dato existente.'});
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2')
    return res.status(409).json({error:'La operación entra en conflicto con registros relacionados.'});
  res.status(500).json({error:'Error interno del servidor', detalle:process.env.NODE_ENV==='development'?err.message:undefined});
};
