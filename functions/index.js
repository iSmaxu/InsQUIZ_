// index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const cors = require('cors');
const { Low, JSONFile } = require('lowdb'); // compatible con lowdb@3
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter);

const JWT_SECRET = process.env.JWT_SECRET || 'CAMBIA_ESTA_SECRETA_POR_PRODUCCION';
const JWT_EXPIRES_SECS = Number(process.env.JWT_EXPIRES_SECS) || 60 * 60 * 24 * 7; // 7 días por defecto

async function initDB(){
  await db.read();
  if(!db.data) db.data = { licenses: [] };
  await db.write();
}
initDB();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Crear licencia (backoffice)
app.post('/create-license', async (req,res)=>{
  const { clientName, maxDevices = 1 } = req.body;
  await db.read();
  const key = (req.body.key) ? req.body.key : nanoid(10).toUpperCase();
  const license = { key, clientName, maxDevices, devices: [], revoked:false, createdAt:new Date().toISOString() };
  db.data.licenses.push(license);
  await db.write();
  res.json(license);
});

// Activar licencia (cliente)
app.post('/activate', async (req,res)=>{
  const { licenseKey, installationId, appId, appVersion } = req.body;
  if(!licenseKey || !installationId) return res.status(400).json({ error: 'licenseKey y installationId requeridos' });
  await db.read();
  const lic = db.data.licenses.find(l => l.key === licenseKey);
  if(!lic) return res.status(404).json({ error: 'Licencia no encontrada' });
  if(lic.revoked) return res.status(403).json({ error: 'Licencia revocada' });
  if(!lic.devices.includes(installationId) && lic.devices.length >= (lic.maxDevices||1)) {
    return res.status(403).json({ error: 'Máximo de dispositivos alcanzado' });
  }
  if(!lic.devices.includes(installationId)) lic.devices.push(installationId);
  await db.write();

  const payload = { licenseKey, installationId, appId, appVersion };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_SECS });
  res.json({ token, expiresIn: JWT_EXPIRES_SECS });
});

// Validar token (cliente)
app.post('/validate', async (req,res)=>{
  const { token } = req.body;
  if(!token) return res.status(400).json({ valid:false, error:'token requerido' });
  try{
    const payload = jwt.verify(token, JWT_SECRET);
    await db.read();
    const lic = db.data.licenses.find(l => l.key === payload.licenseKey);
    if(!lic || lic.revoked || !lic.devices.includes(payload.installationId)) {
      return res.status(403).json({ valid:false, error:'Licencia inválida o revocada' });
    }
    return res.json({ valid:true, payload });
  }catch(e){
    return res.status(403).json({ valid:false, error: e.message });
  }
});

// Revoke (backoffice)
app.post('/revoke', async (req,res)=>{
  const { licenseKey } = req.body;
  if(!licenseKey) return res.status(400).json({ error:'licenseKey requerido' });
  await db.read();
  const lic = db.data.licenses.find(l => l.key === licenseKey);
  if(!lic) return res.status(404).json({ error:'No existe' });
  lic.revoked = true;
  await db.write();
  res.json({ ok:true });
});

// Remove device (backoffice)
app.post('/remove-device', async (req,res)=>{
  const { licenseKey, installationId } = req.body;
  if(!licenseKey || !installationId) return res.status(400).json({ error:'licenseKey y installationId requeridos' });
  await db.read();
  const lic = db.data.licenses.find(l => l.key === licenseKey);
  if(!lic) return res.status(404).json({ error:'No existe' });
  lic.devices = (lic.devices || []).filter(d=>d !== installationId);
  await db.write();
  res.json({ ok:true });
});

const PORT = process.env.PORT || 4000;
const functions = require("firebase-functions");
exports.api = functions.https.onRequest(app);
// FIN index.js
