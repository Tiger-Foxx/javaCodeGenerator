import React from "react";
import { Circles } from "react-loader-spinner";
import "./LoadingSpinner.css";

export const LoadingSpinner = () => (
    <div className="loading-spinner">
        <Circles
            height="80"
            width="80"
            color="#4fa94d"
            ariaLabel="circles-loading"
        />
        <p>Conversion en cours...</p>
    </div>
);
