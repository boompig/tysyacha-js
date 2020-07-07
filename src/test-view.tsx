import React, { PureComponent } from "react";
import { TestRoundView } from "./test-round-view";

interface ITestProps {}

interface ITestState {
    playerNames: string[];

    /**
     * Index into playerNames
     */
    dealerIndex: number;

    scores: {[key: string]: number};

    /**
     * Current round number
     */
    round: number;
}

/**
 * This is the game.
 */
export class TestView extends PureComponent<ITestProps, ITestState> {
    constructor(props: ITestProps) {
        super(props);

        // TODO fictitious player names
        const playerNames = ["Alice", "Daniel", "Boris"]

        const scores = {} as {[key: string]: number};
        playerNames.forEach((name: string) => {
            scores[name] = 0;
        });

        this.state = {
            playerNames: playerNames,
            dealerIndex: 0,
            scores: scores,
            round: 0,
        };

        this.onRoundOver = this.onRoundOver.bind(this);
    }

    onRoundOver(scores: {[key: string]: number}) {
        const newScores = Object.assign({}, this.state.scores);
        for(let [name, pts] of Object.entries(scores)) {
            newScores[name] += pts;
        }
        this.setState({
            scores: newScores,
            round: this.state.round + 1,
            dealerIndex: (this.state.dealerIndex + 1) % 3,
        });

    }

    render() {
        return <TestRoundView
            playerNames={this.state.playerNames}
            dealerIndex={this.state.dealerIndex}
            onRoundOver={this.onRoundOver} />
    }
}