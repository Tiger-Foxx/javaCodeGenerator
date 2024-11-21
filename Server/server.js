const express = require("express");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const JSZip = require("jszip");
const { parseXMI } = require("./src/parser");
const { generateJavaClasses } = require("./src/generator");

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/convert", upload.single("xmiFile"), async (req, res) => {
  const tempPath = req.file.path;
  const xmiPath = `${tempPath}.xmi`;
  const outputDir = "GeneratedCode";

  try {
    console.log("Renommage du fichier XMI...");
    await fs.rename(tempPath, xmiPath);

    console.log("Analyse du fichier XMI...");
    const xmiData = await parseXMI(xmiPath);

    console.log("Création des fichiers Java...");
    await generateJavaClasses(xmiData, outputDir);

    console.log("Création de l'archive ZIP...");
    const zip = new JSZip();
    const files = await fs.readdir(outputDir);

    for (const file of files) {
      const content = await fs.readFile(path.join(outputDir, file));
      zip.file(file, content);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    console.log("Nettoyage des fichiers temporaires...");
    await fs.remove(outputDir);
    await fs.remove(xmiPath);

    console.log("Envoi du fichier ZIP...");
    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", 'attachment; filename="GeneratedCode.zip"');
    res.send(zipBuffer);
  } catch (error) {
    console.error("Erreur lors de la conversion :", error);
    res.status(500).send("Erreur lors de la conversion.");
  }
});


app.listen(3000, () => {
  console.log("Serveur démarré sur http://localhost:3000");
});
