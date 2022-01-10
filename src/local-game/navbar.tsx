import React, { FC } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface IProps {
    /**
     * If specified and not null, it means we're playing a game
     */
    gameId?: string | null;

    /**
     * Current nav hash
     */
    hash: string;

    /**
     * Optionally provide a handler for what to do on a new hash
     * Overrides the default handler (which just sets the nav hash and refreshes the page)
     */
    setNavHash?: (newHash: string) => void;
};

const Navbar: FC<IProps> = (props: IProps) => {
    function defaultChangeNavHash(newHash: string) {
        console.debug('Using default hash handler in navbar');
        const url = new URL(window.location.href);
        url.hash = newHash;
        console.debug(`Hash is now ${newHash}`);
        window.location.href = url.toString();
        window.location.reload();
    }

    function handleClick(e: React.SyntheticEvent<HTMLAnchorElement>) {
        const url = new URL((e.target as HTMLAnchorElement).href);
        const hash = url.hash;
        if (props.setNavHash) {
            props.setNavHash(hash);
        } else {
            defaultChangeNavHash(hash);
        }
    }

    return (<nav className="navbar navbar-expand-md navbar-light bg-light" id="tysyacha-navbar">
        <a className="navbar-brand" href="#" onClick={handleClick}>Tysyacha</a>

        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>

        {/* <span className="navbar-text">Local Game {props.gameId} vs AI</span> */}

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="nav nav-pills">
                {/* if there is no game ID specified, cannot navigate to the game */}
                { props.gameId ?
                    <li className="nav-item">
                        <a className={ props.hash === '#local-ai-game' ? "nav-link active" : "nav-link" } href="#local-ai-game" onClick={handleClick}>Game</a>
                    </li> :
                    null }
                {/* if there is no game ID specified, cannot show the score card - what game are we showing? */}
                <li className="nav-item">
                    <a className={ props.hash === '#rules' ? "nav-link active" : "nav-link" } href="#rules" onClick={handleClick}>Rules</a>
                </li>
            </ul>
        </div>
    </nav>);
};

export {
    Navbar,
};