import React, { FC } from "react";

interface IProps {
    gameId: string;
    /**
     * Current nav hash
     */
    hash: string;
    setNavHash(newHash: string): void;
};

const Navbar: FC<IProps> = (props: IProps) => {
    function handleClick(e: React.SyntheticEvent<HTMLAnchorElement>) {
        const url = new URL((e.target as HTMLAnchorElement).href);
        const hash = url.hash;
        props.setNavHash(hash);
    }

    return (<nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="#">Tysyacha</a>

        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
            aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="nav nav-pills">
                <li className="nav-item">
                    <a className={ props.hash === '#game' ? "nav-link active" : "nav-link" } href="#game" onClick={handleClick}>Game</a>
                </li>
                <li className="nav-item">
                    <a className={ props.hash === '#scorecard' ? "nav-link active" : "nav-link" } href="#scorecard" onClick={handleClick}>Scorecard</a>
                </li>
                <li className="nav-item">
                    <a className={ props.hash === '#rules' ? "nav-link active" : "nav-link" } href="#rules" onClick={handleClick}>Rules</a>
                </li>
            </ul>
        </div>
        <span className="navbar-text">Local Game {props.gameId} vs AI</span>
    </nav>);
};

export {
    Navbar,
};