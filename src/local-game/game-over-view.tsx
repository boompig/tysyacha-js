import React, {FC} from 'react';

interface IProps {
    winningPlayers: string[];
    /**
     * Go back to the landing page
     */
    onBack(): void;
};

export const GameOverView : FC<IProps> = (props: IProps) => {
    return (<div>
        <h3>Game Over!</h3>
        <p>The game is over.</p>

        <p>
            {props.winningPlayers.length === 1 ? `The winner is ${props.winningPlayers[0]}.` :
                `The winning players are ${props.winningPlayers.join(', ')}.`}
        </p>

        <button type="button" className="btn btn-lg btn-primary"
            onClick={props.onBack}>Back to Loading Screen</button>
    </div>);
};

export default GameOverView;