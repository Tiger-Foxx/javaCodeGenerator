const fs = require("fs-extra");
const path = require("path");
const { parseXMI } = require("./src/parser");
const { generateJavaClasses } = require("./src/generator");

const GENERATED_DIR = "GeneratedCode";

async function main(xmiFilePath) {
  try {
    const xmiData = await parseXMI(xmiFilePath);

    await fs.ensureDir(GENERATED_DIR);

    await generateJavaClasses(xmiData, GENERATED_DIR);

    console.log("Toutes les classes ont été générées avec succès !");
  } catch (error) {
    console.error("Erreur :", error);
  }
}

main("TestIHMCard.xmi");
