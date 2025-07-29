const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000 || process.env.PORT;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'domainList.json');

// JSON dosyasını oku
function readData() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// JSON dosyasına yaz
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/', (req, res) => {
    res.send("Uygulama çalışıyor");
});

app.get('/domains', (req, res) => {
    const data = readData();
    res.json(data);
});

app.post('/domains', (req, res) => {
    const data = readData();
    // Beklenen format: { "yeni.com": ["yeni.com", "sub.yeni.com"] }
    if (
      typeof req.body === 'object' &&
      !Array.isArray(req.body) &&
      Object.keys(req.body).length === 1
    ) {
      const domain = Object.keys(req.body)[0];
      const subdomains = req.body[domain];
      if (!domain || !Array.isArray(subdomains)) {
        return res.status(400).json({ error: 'Invalid format' });
      }
      if (data[domain]) {
        return res.status(400).json({ error: 'Domain already exists' });
      }
      data[domain] = subdomains;
      writeData(data);
      return res.status(201).json({ domain, subdomains });
    }
    return res.status(400).json({ error: 'Invalid format. Use { \"domain.com\": [ ... ] }' });
});  

app.delete('/domains/:domain', (req, res) => {
    const data = readData();
    const { domain } = req.params;
    if (!data[domain]) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    const deleted = data[domain];
    delete data[domain];
    writeData(data);
    res.json({ deleted });
});

app.post('/domains/:domain/subdomains', (req, res) => {
    const data = readData();
    const { domain } = req.params;
    const { subdomain } = req.body;
    if (!data[domain]) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    if (!subdomain) {
      return res.status(400).json({ error: 'subdomain is required' });
    }
    if (data[domain].includes(subdomain)) {
      return res.status(400).json({ error: 'Subdomain already exists' });
    }
    data[domain].push(subdomain);
    writeData(data);
    res.status(201).json({ subdomain });
});

app.delete('/domains/:domain/subdomains/:subdomain', (req, res) => {
    const data = readData();
    const { domain, subdomain } = req.params;
    if (!data[domain]) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    const index = data[domain].indexOf(subdomain);
    if (index === -1) {
      return res.status(404).json({ error: 'Subdomain not found' });
    }
    const deleted = data[domain].splice(index, 1);
    writeData(data);
    res.json({ deleted: deleted[0] });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});