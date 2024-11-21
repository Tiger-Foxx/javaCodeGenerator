const fs = require("fs-extra");
const { parseStringPromise } = require("xml2js");

const { extractAssociations, integrateAssociations } = require("./associations");

async function parseXMI(filePath) {
  const xmiContent = await fs.readFile(filePath, "utf-8");
  const xmiData = await parseStringPromise(xmiContent);

  const model = xmiData["xmi:XMI"]["uml:Model"][0];
  const elements = model.packagedElement;

  // Mapper les IDs vers les noms
  const idToName = buildIdToNameMap(elements);

  // Identifier les types primitifs
  const primitiveTypes = buildPrimitiveTypeMap(elements);

  // Construire la liste des classes
  const classes = elements
    .filter((el) => el.$["xmi:type"] === "uml:Class")
    .map((el) => buildClassData(el, idToName, primitiveTypes));

  // Extraire et intégrer les associations
  const associations = extractAssociations(elements, idToName);
  const classMap = Object.fromEntries(classes.map((cls) => [cls.name, cls]));
  integrateAssociations(associations, classMap);

  return { classes: Object.values(classMap), idToName, primitiveTypes };
}


// Construire le mappage ID -> Nom
function buildIdToNameMap(elements) {
  const map = {};
  elements.forEach((el) => {
    if (el.$.name) {
      map[el.$["xmi:id"]] = el.$.name;
    }
    if (el.packagedElement) {
      Object.assign(map, buildIdToNameMap(el.packagedElement));
    }
  });
  return map;
}

// Construire le mappage des types primitifs (xmi:id -> type Java)
function buildPrimitiveTypeMap(elements) {
  const map = {};
  elements
    .filter((el) => el.$["xmi:type"] === "uml:PrimitiveType")
    .forEach((el) => {
      map[el.$["xmi:id"]] = el.$.name;
    });
  return map;
}

// Construire les données pour une classe
function buildClassData(classElement, idToName, primitiveTypes) {
  const name = classElement.$.name;
  const attributes = (classElement.ownedAttribute || []).map((attr) => ({
    name: attr.$.name,
    type: resolveType(attr.$.type, idToName, primitiveTypes),
    visibility: attr.$.visibility || "private",
  }));

  const methods = (classElement.ownedOperation || []).map((op) => ({
    name: op.$.name,
    returnType: resolveType(
      op.ownedParameter?.[0]?.$.type || "void",
      idToName,
      primitiveTypes
    ),
    visibility: op.$.visibility || "public",
  }));

  const parentId = classElement.generalization?.[0]?.$.general || null;
  const parentClass = parentId ? idToName[parentId] : null;

  return { name, attributes, methods, parentClass, relations: [] }; // Ajout de relations vide par défaut
}


// Résoudre un type (classe ou primitif)
function resolveType(typeId, idToName, primitiveTypes) {
  if (!typeId) return "Object";
  return primitiveTypes[typeId] || idToName[typeId] || "Object";
}

module.exports = { parseXMI };
