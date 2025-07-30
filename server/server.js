const express = require('express');
const cors = require('cors');

const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
connectDB();

const Domain =  require("./models/Model");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send("Uygulama çalışıyor");
});

//Tüm domainleri alma
app.get("/domains", async (req,res) => {
   try {
      const domains = await Domain.find();
      res.json(domains);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
});

//Üst domain ekleme
app.post("/domains", async (req,res) => {
  try {
      const domain = new Domain(req.body);
      await domain.save();
      res.status(201).json(domain);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
});

//Var olan domaine subdomainler eklemek
app.patch("/domains/:id/add-subdomains", async (req, res) => {
  try {
    const domainId = req.params.id;
    const { newSubdomains } = req.body; // yeni subdomain(ler) dizi olarak gelmeli

    if (!Array.isArray(newSubdomains)) {
      return res.status(400).json({ message: "newSubdomains bir dizi olmalı" });
    }

    const updatedDomain = await Domain.findByIdAndUpdate(
      domainId,
      { $addToSet: { subdomains: { $each: newSubdomains } } }, // tekrar edenleri önler
      { new: true }
    );

    if (!updatedDomain) {
      return res.status(404).json({ message: "Domain bulunamadı" });
    }

    res.json(updatedDomain);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//domainleri silme
app.delete("/domains/:id", async (req,res) => {
  try {
      const domain = await Domain.findByIdAndDelete(req.params.id);
      
      if (!domain) {
        return res.status(404).json({ message: 'Ürün bulunamadı' });
      }
      
      res.json({ message: 'Ürün başarıyla silindi' });
    } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

//Bir domainin subdomainlerini silme
app.patch("/domains/:id/remove-subdomain", async (req, res) => {
  try {
    const domainId = req.params.id;
    const { subdomainToRemove } = req.body;

    if (!subdomainToRemove) {
      return res.status(400).json({ message: "Silinecek alt domain belirtilmedi." });
    }

    const updatedDomain = await Domain.findByIdAndUpdate(
      domainId,
      { $pull: { subdomains: subdomainToRemove } }, // Belirtilen subdomain'i çıkarır
      { new: true }
    );

    if (!updatedDomain) {
      return res.status(404).json({ message: "Domain bulunamadı." });
    }

    res.json(updatedDomain);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Üst domain ismini güncelle
app.patch("/domains/:id/update-domain", async (req, res) => {
  try {
    const domainId = req.params.id;
    const { newDomain } = req.body;

    if (!newDomain || typeof newDomain !== "string") {
      return res.status(400).json({ message: "Yeni domain ismi geçerli değil." });
    }

    // Aynı isimde başka domain varsa engelle (opsiyonel)
    const existing = await Domain.findOne({ domain: newDomain });
    if (existing && existing._id.toString() !== domainId) {
      return res.status(400).json({ message: "Bu domain ismi zaten kullanılıyor." });
    }

    const updatedDomain = await Domain.findByIdAndUpdate(
      domainId,
      { domain: newDomain },
      { new: true }
    );

    if (!updatedDomain) {
      return res.status(404).json({ message: "Domain bulunamadı." });
    }

    res.json(updatedDomain);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Subdomain ismini güncelle
app.patch("/domains/:id/update-subdomain", async (req, res) => {
  try {
    const domainId = req.params.id;
    const { oldSubdomain, newSubdomain } = req.body;

    if (!oldSubdomain || !newSubdomain) {
      return res.status(400).json({ message: "Eski ve yeni subdomain belirtilmeli." });
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain bulunamadı." });
    }

    // Eski subdomain dizide yoksa hata dön
    const index = domain.subdomains.indexOf(oldSubdomain);
    if (index === -1) {
      return res.status(400).json({ message: "Güncellenecek subdomain bulunamadı." });
    }

    // Aynı subdomain zaten varsa engelle (opsiyonel)
    if (domain.subdomains.includes(newSubdomain)) {
      return res.status(400).json({ message: "Yeni subdomain zaten mevcut." });
    }

    domain.subdomains[index] = newSubdomain;
    await domain.save();

    res.json(domain);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});