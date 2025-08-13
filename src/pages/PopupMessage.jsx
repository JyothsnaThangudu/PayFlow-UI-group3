// PopupMessage.jsx
import React from 'react';

const PopupMessage = ({ title, message, type, buttons = [] }) => {
    return (
        <div className="popup-overlay">
            <div className={`popup-box ${type}`}>
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="popup-buttons">
                    {buttons.map((btn, index) => (
                        <button key={index} onClick={btn.onClick}>
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PopupMessage;
