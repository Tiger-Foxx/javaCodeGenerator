import React from "react";
import { useDropzone } from "react-dropzone";
import "./FileUpload.css";

export const FileUpload = ({ onFileUpload }) => {
    const { getRootProps, getInputProps } = useDropzone({
        accept: ".xmi",
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                onFileUpload(acceptedFiles[0]);
            }
        },
    });

    return (
        <div className="file-upload" {...getRootProps()}>
            <input {...getInputProps()} />
            <p>Glissez et déposez un fichier XMI ici, ou cliquez pour sélectionner un fichier</p>
        </div>
    );
};
