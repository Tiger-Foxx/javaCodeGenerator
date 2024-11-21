import React, { useState } from "react";
import { FileUpload } from "./components/FileUpload";
import { LoadingSpinner } from "./components/LoadingSpinner";
import "./App.css";

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [zipFile, setZipFile] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleFileUpload = async (file) => {
        setIsLoading(true);
        try {
            // Préparer les données à envoyer
            const formData = new FormData();
            formData.append("xmiFile", file);

            // Appeler l'API backend
            const response = await fetch("http://localhost:3000/convert", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const blob = await response.blob();
                const fileURL = URL.createObjectURL(blob);

                setZipFile(fileURL); // Définir l'URL du fichier ZIP
                setTimeout(() => {
                    setIsSuccess(true); // Afficher la page de succès après un délai
                }, 2000);
            } else {
                alert("Une erreur est survenue lors de la conversion !");
            }
        } catch (error) {
            console.error("Erreur :", error);
        } finally {
            setTimeout(() => {
                setIsLoading(false); // Arrêter l'animation de chargement
            }, 2000);
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <h1>Convertisseur XMI vers Java</h1>
                <p>Convertissez vos fichiers XMI en code Java avec facilité.</p>
            </header>
            <main>
                {isLoading ? (
                    <LoadingSpinner />
                ) : isSuccess ? (
                    <div className="success-page">
                        <h2>Succès !</h2>
                        <p>Votre fichier a été converti avec succès.</p>
                        <button
                            className="download-button"
                            onClick={() => {
                                // Télécharger le fichier uniquement au clic
                                const link = document.createElement("a");
                                link.href = zipFile;
                                link.download = "GeneratedCode.zip";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                        >
                            Télécharger le dossier ZIP
                        </button>
                        <button
                            className="upload-another-button"
                            onClick={() => {
                                setZipFile(null);
                                setIsSuccess(false);
                            }}
                        >
                            Convertir un autre fichier
                        </button>
                    </div>
                ) : (
                    <FileUpload onFileUpload={handleFileUpload} />
                )}
            </main>
        </div>
    );
}

export default App;
