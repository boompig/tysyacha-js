import React from "react";
import { Card, Hand } from "../cards";
import { GamePhase } from "../game-mechanics";
import {CardView} from "../local-components/card-view";


interface IProps {
    contractPlayer: string;
    contractPlayerCards: Hand;
    treasureCards: Card[];
    selectedCards: {[key: string]: Card};
    playerNames: string[];
    onSelect: (targetPlayer: string, card: Card) => any;
    onDistribute: () => any;
}

interface IState {
    selectedPlayer: string | null;
}

export class DistributeCardsView extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        this.state = {
            selectedPlayer: null,
        };
        this.selectPlayer = this.selectPlayer.bind(this);
        this.onSelect = this.onSelect.bind(this);
    }

    selectPlayer(player: string) {
        if (player === this.state.selectedPlayer) {
            this.setState({
                selectedPlayer: null,
            });
        } else {
            this.setState({
                selectedPlayer: player,
            });
        }
    }

    onSelect(card: Card) {
        if(!this.state.selectedPlayer) {
            return;
        }
        this.props.onSelect(this.state.selectedPlayer, card);
    }

    render() {
        const cards = this.props.contractPlayerCards.cards.slice();
        cards.push(...this.props.treasureCards);
        const bigHand = new Hand(cards);

        const cardElems = [] as JSX.Element[];
        Object.entries(bigHand.cardsBySuit).forEach(([suit, cards]) => {
            cards.forEach((card: Card, i: number) => {
                const isSelected = Object.values(this.props.selectedCards).includes(card);
                let targetPlayer = null;
                if (isSelected) {
                    // find the corresponding player name
                    for (let [name, otherCard] of Object.entries(this.props.selectedCards)) {
                        if (card === otherCard) {
                            targetPlayer = name;
                        }
                    }
                }
                const elem = (<div key={`distribute-card-container-${suit}-${i}`}>
                    <CardView key={`distribute-card-${i}`}
                        suit={card.suit}
                        value={card.value}
                        classNames={isSelected ? ["card-selected"] : []}
                        onClick={(e) => this.onSelect(card)} />
                    {targetPlayer ?
                        <div className="target-player">sending to {targetPlayer}</div>
                        : null}
                </div>);
                cardElems.push(elem);
            });
        })

        const playerButtons = this.props.playerNames.filter((name: string) => {
            return name !== this.props.contractPlayer;
        }).map((name: string, i :number) => {
            const classes = ['btn', 'btn-secondary'];
            const isSelected = this.state.selectedPlayer === name
            if (isSelected) {
                classes.push('active');
            }
            return (<label key={`player-${i}`}
                className={classes.join(" ")}>
                    <input type="radio" name="options" id={`options-${i}`} autoComplete="off"
                        checked={isSelected}
                        onChange={(e) => this.selectPlayer(name) }/> {name}
            </label>);
        })

        return (<form className="distribute-cards-form">
            <div className="btn-group btn-group-toggle" data-toggle="buttons">
                { playerButtons }
            </div>
            <div className="player-hand">
                { cardElems }
            </div>
            <button type="button" className="btn btn-primary"
                onClick={(e) => this.props.onDistribute()}>Distribute Cards</button>
        </form>);
    }
}
