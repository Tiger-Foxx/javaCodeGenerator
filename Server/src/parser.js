const fs = require("fs-extra");
const { parseStringPromise } = require("xml2js");

const { extractAssociations, integrateAssociations } = require("./associations");

async function parseXMI(filePath) {
  const xmiContent = await fs.readFile(filePath, "utf-8");
  const xmiData = await parseStringPromise(xmiContent);

  const model = xmiData["xmi:XMI"]["uml:Model"][0];
  const elements = model.packagedElement;

  const idToName = buildIdToNameMap(elements);

  const primitiveTypes = buildPrimitiveTypeMap(elements);

  const classes = elements
    .filter((el) => el.$["xmi:type"] === "uml:Class")
    .map((el) => buildClassData(el, idToName, primitiveTypes));

  const associations = extractAssociations(elements, idToName);
  const classMap = Object.fromEntries(classes.map((cls) => [cls.name, cls]));
  integrateAssociations(associations, classMap);

  return { classes: Object.values(classMap), idToName, primitiveTypes };
}


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

function buildPrimitiveTypeMap(elements) {
  const map = {};
  elements
    .filter((el) => el.$["xmi:type"] === "uml:PrimitiveType")
    .forEach((el) => {
      map[el.$["xmi:id"]] = el.$.name;
    });
  return map;
}

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

  return { name, attributes, methods, parentClass, relations: [] };
}


function resolveType(typeId, idToName, primitiveTypes) {
  if (!typeId) return "Object";
  return primitiveTypes[typeId] || idToName[typeId] || "Object";
}

module.exports = { parseXMI };
