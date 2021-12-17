import React, { FC, useState } from "react";
import "./select-player-name-view.css";

interface ISelectPlayerNameViewProps {
    onSelectPlayerName(playerName: string): void;
}

/**
 * This is a component that should be displayed inside another component
 * It allows our player to pick a name
 */
const SelectPlayerNameView : FC<ISelectPlayerNameViewProps> = (props: ISelectPlayerNameViewProps) => {
    let [playerName, setPlayerName] = useState("");

    function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        // console.log(`submitting ${playerName} to parent component`);
        props.onSelectPlayerName(playerName);

        return false;
    }

    function changePlayerName(e: React.SyntheticEvent<HTMLInputElement>) {
        const name = (e.target as HTMLInputElement).value;
        setPlayerName(name);
        // console.log(`playerName = ${name}`);
    }

    return (
        <div className="container">
            <form onSubmit={handleSubmit}>
                <label htmlFor="player_name">Your Name</label>
                <input type="text" placeholder="enter your name" required={true} minLength={2} name="player_name"
                    className="form-control"
                    onChange={changePlayerName}
                    value={playerName} />

                <button type="submit" className="form-control btn btn-primary">OK</button>
            </form>
        </div>
    );
};

export default SelectPlayerNameView;