/**
 * Analyse et extrait les associations du fichier XMI.
 * @param {Array} elements - Liste des éléments du modèle UML.
 * @param {Object} idToName - Mappage des IDs vers les noms.
 * @returns {Array} - Liste des associations avec leurs propriétés.
 */
function extractAssociations(elements, idToName) {
    return elements
      .filter((el) => el.$["xmi:type"] === "uml:Association")
      .map((association) => {
        const memberEnds = association.$.memberEnd.split(" ");
        const [sourceId, targetId] = memberEnds;
  
        const lowerValue = (association.lowerValue || [])
          .map((v) => parseInt(v.$.value || "0", 10))[0] || 0;
  
        const upperValue = (association.upperValue || [])
          .map((v) => (v.$.value === "*" ? Infinity : parseInt(v.$.value, 10)))[0] || 1;
  
        return {
          name: association.$.name || null,
          source: idToName[sourceId] || sourceId,
          target: idToName[targetId] || targetId,
          lowerValue,
          upperValue,
        };
      });
  }
  
  /**
   * Ajoute les relations d'association dans la classe cible.
   * @param {Object} associations - Liste des associations extraites.
   * @param {Object} classMap - Liste des classes sous forme de mappage.
   */
  function integrateAssociations(associations, classMap) {
    associations.forEach(({ source, target, lowerValue, upperValue }) => {
      if (classMap[source]) {
        const multiplicity = getMultiplicity(lowerValue, upperValue);
        classMap[source].relations.push({
          target,
          multiplicity,
        });
      }
    });
  }
  
  /**
   * Génère le type Java pour une relation en fonction des cardinalités.
   * @param {number} lowerValue - Cardinalité minimale.
   * @param {number} upperValue - Cardinalité maximale.
   * @returns {string} - Type Java (e.g., List, Set).
   */
  function getMultiplicity(lowerValue, upperValue) {
    if (upperValue === 1) {
      return "1-to-1";
    } else if (upperValue === Infinity) {
      return "1-to-many";
    } else {
      return "many-to-many";
    }
  }
  
  module.exports = { extractAssociations, integrateAssociations };
  