import React from 'react';
import './Header.css';
import { FaBell, FaEnvelope } from 'react-icons/fa';

export default function Header() {
    return (
        <div className="header-container">
            <input
                type="text"
                placeholder="Search for employee, candidate or project"
                className="search-bar"
            />
            <div className="header-right">
                <FaBell className="icon" />
                <FaEnvelope className="icon" />
                <img
                    src="https://i.pravatar.cc/40"
                    alt="avatar"
                    className="avatar"
                />
                <span className="user-name">Alessandra Fox</span>
            </div>
        </div>
    );
}



// import React from 'react';
// import './Header.css';
// import { FaBell, FaEnvelope } from 'react-icons/fa';
// export default function Header() {
//     return (
//         <>
//             <input
//                 type="text"
//                 placeholder="Search for employee, candidate or project"
//                 className="search-bar"
//             />
//             <div className="header-right">
//                 <FaBell className="icon" />
//                 <FaEnvelope className="icon" />
//                 <img
//                     src="https://i.pravatar.cc/40"
//                     alt="avatar"
//                     className="avatar"
//                 />
//                 <span className="user-name">Alessandra Fox</span>
//             </div>
//         </>
//     );
// }
