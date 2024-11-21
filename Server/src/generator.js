const path = require("path");
const fs = require("fs-extra");

/**
 * Génère les fichiers Java à partir des données des classes analysées.
 * @param {Object} xmiData - Données analysées du fichier XMI.
 * @param {string} outputDir - Répertoire d'exportation des fichiers Java.
 */
async function generateJavaClasses({ classes }, outputDir) {
  try {
    // Assurez-vous que le répertoire existe
    await fs.ensureDir(outputDir);

    for (const cls of classes) {
      const javaCode = generateJavaCode(cls);
      const filePath = path.join(outputDir, `${cls.name}.java`);
      await fs.writeFile(filePath, javaCode, "utf-8");
      console.log(`Class generated: ${filePath}`);
    }
    return true;
  } catch (error) {
    console.error("Erreur lors de la génération des classes :", error);
    throw error; // Relancer l'erreur pour qu'elle soit capturée ailleurs
  }
}

/**
 * Génère le code Java pour une classe donnée.
 * @param {Object} classData - Données de la classe (nom, attributs, méthodes, etc.).
 * @returns {string} - Le code Java généré pour la classe.
 */
function generateJavaCode({ name, attributes, methods, parentClass, relations }) {
  const parentDeclaration = parentClass ? ` extends ${parentClass}` : "";

  const attributeLines = attributes.map(
    (attr) => `    private ${attr.type} ${attr.name};`
  );

  // Générer les relations d'association
  const relationLines = (relations || []).map(({ target, multiplicity }) => {
    if (multiplicity === "1-to-1") {
      return `    private ${target} ${target.toLowerCase()};`;
    } else if (multiplicity === "1-to-many") {
      return `    private List<${target}> ${target.toLowerCase()}List;`;
    } else if (multiplicity === "many-to-many") {
      return `    private Set<${target}> ${target.toLowerCase()}Set;`;
    }
  });

  // Générer les getters et setters pour chaque attribut
  const getterSetterLines = attributes.flatMap((attr) => [
    generateGetter(attr),
    generateSetter(attr),
  ]);

  // Gestion des méthodes (avec surcharge si nécessaire)
  const methodLines = methods.flatMap((method) =>
    generateOverloadedMethods(method)
  );

  return `
import java.util.List;
import java.util.Set;

public class ${name}${parentDeclaration} {

${[...attributeLines, ...relationLines].join("\n")}

${getterSetterLines.join("\n\n")}

${methodLines.join("\n\n")}

}
  `.trim();
}

/**
 * Génère un getter pour un attribut.
 * @param {Object} attribute - Données de l'attribut (nom, type, etc.).
 * @returns {string} - Code Java du getter.
 */
function generateGetter(attribute) {
  const capitalized = capitalize(attribute.name);
  return `
    public ${attribute.type} get${capitalized}() {
        return this.${attribute.name};
    }`.trim();
}

/**
 * Génère un setter pour un attribut.
 * @param {Object} attribute - Données de l'attribut (nom, type, etc.).
 * @returns {string} - Code Java du setter.
 */
function generateSetter(attribute) {
  const capitalized = capitalize(attribute.name);
  return `
    public void set${capitalized}(${attribute.type} ${attribute.name}) {
        this.${attribute.name} = ${attribute.name};
    }`.trim();
}

/**
 * Génère les méthodes Java en tenant compte de la surcharge.
 * @param {Object} method - Données de la méthode (nom, type de retour, etc.).
 * @returns {Array<string>} - Liste des méthodes générées.
 */
function generateOverloadedMethods(method) {
  const baseMethod = `
    public ${method.returnType} ${method.name}() {
        // TODO: Implement
    }`.trim();

  // Ajout d'une surcharge fictive avec un paramètre pour démonstration
  const overloadedMethod = `
    public ${method.returnType} ${method.name}(int param) {
        // TODO: Overloaded implementation
    }`.trim();

  return [baseMethod, overloadedMethod];
}

/**
 * Capitalise la première lettre d'une chaîne.
 * @param {string} str - Chaîne à capitaliser.
 * @returns {string} - Chaîne avec la première lettre en majuscule.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { generateJavaClasses };
