import React, { FC } from 'react';
import { MIN_BID_POINTS } from '../game-mechanics';
import { getSuits, Suit, getMarriageValue, getCardValues, CardValue, valueToString } from "../cards";
import "./rules-view.css";

interface IRulesViewProps {

}

export const RulesView : FC<IRulesViewProps> = (props: IRulesViewProps) => {
    const marriageTableRows = getSuits().map((suit: Suit) => {
        return (<tr key={ suit.valueOf() }>
            <td>{suit.toString()}</td>
            <td>{getMarriageValue(suit)}</td>
        </tr>);
    });

    const cardValueTableRows = getCardValues().map((value: CardValue) => {
        return (<tr key={ value.valueOf() }>
            <td>{ valueToString(value) }</td>
            <td>{ value.valueOf() }</td>
        </tr>)
    });

    return (<div className="rules-view">
        <h1>Rules</h1>
        <section>
            <h2>About</h2>
            <p>Tysyacha is a card game of Russian origin played with 3 players.
                The object of the game is to accumulate 1000 points before your opponents.
            </p>
            <p>
                The game is played by bidding on a contract, to be comleted with hidden cards (called <em>treasure</em>).
                It is most similar to card games such as Bridge (in the sense there is a contract) and Poker (in the sense it involves bluffing and relying on hidden cards).
            </p>

            {/* <p>
                Despite the length of this document, the game is quite simple, suitable for both adults new to card games and children 10 years and older.
                Bid for the treasure, declare marriages, win tricks, get points.
            </p> */}
        </section>
        <section>
            <h2>Flow</h2>
            <p>
                Each game consists of multiple rounds, as many as it takes for a player to reach 1000 points.
                In each round, a different player deals. At the beginning of the game, a random player is assigned the dealer role, which then moves clockwise at the conclusion of each round.
            </p>
            <p>
                Each round consists of two phases: bidding, followed by the playing phase, which involes taking <em>tricks</em>.
                During bidding, the players complete for the right to take the hidden <em>treasure</em> cards.
                However, the player who won the bidding now holds a <em>contract</em> for that point value.
                If they do not fulfill their contract, they will be penalized.
            </p>
        </section>
        <section>
            <h2>Dealing</h2>
            <p>Each player is dealt 7 cards from a deck of 24 cards (9 through Ace), and the remaining 3 cards are placed in the middle face-down.
                These cards are called the <em>treasure</em>, and are awarded to whichever player wins the contract.
            </p>
        </section>
        <section>
            <h2>Bidding</h2>
            <p>
                Each player, starting with the player to the left of the dealer.
                That is the total point value they promise to take in the playing phase, summed over all the cards they win in each trick.
                The minimum bid is { MIN_BID_POINTS } points and the bidding must increase in multiples of 5.
                At the end of the bidding phase, the player with the highest bid holds the contract for that point value.
                Any player may pass at any time (declining to make a bid), however once they pass they may <strong>not</strong> re-enter the bidding (in contrast to Bridge).
            </p>

            <div className="alert alert-info" role="alert">
                <strong>Note&nbsp;</strong>Any player can bid for any reason. They may bluff in order to force the bidding to go higher, or gamble on the treasure containing good cards.
            </div>

            <p>
                The bidding ends when either (a) all three players pass, or (b) one player makes a bid and the other two players pass.
                If all three players pass, the cards are re-dealt by the same dealer and the round is re-played.
            </p>

            <p>
                If a player holds a contract at the end of the bidding phase, the three <em>treasure</em> cards are flipped face up for all players to view.
                Then the contract player takes those cards into their hand.
                They may at this point revise their contract up (never down).
            </p>

            <p>
                Finally, the contract player gives one card of their choosing from their hand, face down, to each opponent.
                This card may have been part of the treasure, or may be from their original hand.
                These cards are kept secret; players may not share what cards they have or what they received.
            </p>

            <h3>Contract</h3>

            <p>
                The player who wins the bidding phase is the <em>contract player</em>.
                The winning bid is called the <em>contract</em>.
                If the contract player fulfills their contract at the end of the playing phase, they will get the number of points in their contract.
                If the contract player fails to meet their contract, they will be deducted that number of points.
                Therefore, holding a contract for a large number of points is both lucrative and perilous.
            </p>

            <p>
                The other two players who do not hold the contract will receive as many points as they make during the playing phase (meaning they can never receive negative points).
            </p>

        </section>
        <section>
            <h2>Point Values and Marriages</h2>
            <p>
                The central mechanic of Tysyacha is the <em>marriage</em>.
                A player has a "marriage" if they hold a King and Queen of the same suit.
                That marriage can be declared during the playing phase, awarding that player a large number of points.
                Declaring a marriage also makes that suit the <em>trump</em> suit.
                The various marriage point values can be found in the table below.
            </p>

            <table className="table table-striped table-sm">
                <caption>Table 1: marriage value table</caption>
                <thead>
                    <tr>
                        <th>Suit</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                    { marriageTableRows }
                </tbody>
            </table>

            <p>
                The precedence of the various cards is different in Tysyacha from most card games.
                In the table below, the cards are listed in order of precedence (higher is more powerful) along with their point values.
            </p>

            <table className="table table-striped table-sm">
                <caption>Table 2: card value table</caption>
                <thead>
                    <tr>
                        <th>Card</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    { cardValueTableRows }
                </tbody>
            </table>
        </section>

        <section>
            <h2>Playing Phase - Taking Tricks</h2>

            <p>
                Once the bidding phase is complete and the cards are distributed, each player should have 8 cards.
                The contract player begins the playing phase.
            </p>

            <p>
                A trick consists of a single card from each player, played in clockwise order.
                The player with the "winning" card wins the trick and claims the points inside.
            </p>

            <h3>Starting a Trick</h3>
            <p>
                The first player in a trick may play any card from their hand.
            </p>

            <h3>Playing Subsequent Cards in a Trick</h3>
            <p>
                Subsequent players must play a card of the same suit as the first card in the trick (<em>leading suit</em>).
                If they do not have that suit, they <strong>must</strong> play a card from the trump suit (unlike Bridge where it is optional).
                If they do not have a card of the trump suit, or there is no trump, they may play any other card.
            </p>

            <h3>Who Wins the Trick?</h3>
            <p>
                If there is a trump suit, the highest trump card wins the trick (see table 2 for precedence).
                If no trump has been played, the highest card played in the suit of the first card ("leading suit").
                Therefore, all cards of suits other than the trump suit and leading suit may not win tricks.

                The winner of the trick has won the right to go next (start the next trick).
            </p>

            <h3>Declaring Marriages</h3>
            <p>
                During playing, a player may declare a marriage on their turn, after they have won at least one trick.
                To do so, a player plays a king or queen of the suit in which they hold the marriage and declare "marriage" publicly.
                That suit now becomes the trump.
            </p>

            <div className="alert alert-info" role="alert">
                <strong>Note&nbsp;</strong>The contract player may not declare a marriage on their first turn, since winning a trick is necessary first.
            </div>

            <p>More than one marriage may be declared per game, by any player. The trump changes immediately after the marriage declaration, voiding the previous trump suit.</p>

            <div className="alert alert-warning" role="alert">
                <strong>Warning&nbsp;</strong>Contract players should be careful when giving away queens and kings to other players at the end of bidding, as that may give those players a card they need for a marriage, possibly ruining your plans.
            </div>

            <p>While no marriages are declared, there is no trump suit. There is no trump suit at the beginning of play.</p>

            <h3>End of the Playing Phase - Scoring</h3>
            <p>
                Once all 8 tricks have been taken, players count the number of points contained in each trick they have taken and sum them.
                To this total, they add the point value of any marriages that they declared (see Table 1).
                Point totals are rounded to the nearest multiple of 5 (e.g. 12 is rounded down to 10 but 73 is rounded up to 75).
            </p>

            <p>
                If the contract player has fulfilled their contract (obtained the number of points of their contract or more), they receive the number of points in their contract.
                They do not receive the excess points.
                If the contract player failed to meet their contract, the full value of the contract is deducted from their point total, regardless of how close they came to fulfilling the contract (e.g. if a player bid 140 points and obtained 135 points, they receive -140 points).
            </p>

            <p>
                All other players receive the points they have obtained, including all marriage points.
            </p>

            <p>
                No points are awarded for marriages that have not been declared.
            </p>
        </section>

        <section>
            <h2>Misc.</h2>

            <p>If, after 3 deals, a contract is not established (all players pass), the dealing player receives -120 points and the dealer role is rotated clockwise.</p>

            <p>No player may bid more than 120 points unless they hold at least one marriage in their hand.</p>

            <p>The total number of points in the deck (without marriages) is 120.</p>
        </section>

        <section>
            <h2>Glossary</h2>

            <ul>
                <li>
                    <strong className="glossary-term">Contract</strong> - the highest (winning) bid in the bidding phase. The contract player must achieve at least this number during the playing phase.
                </li>
                <li>
                    <strong className="glossary-term">Contract Player</strong> - the player with the highest bid during the bidding phase.
                </li>
                <li>
                    <strong className="glossary-term">Leading Suit</strong> - the suit of the first card in a trick. Players must play cards of the same suit if they can.
                </li>
                <li>
                    <strong className="glossary-term">Marriage</strong> - a king and queen of the same suit. It may be declared during the playing phase to receive a large number of bonus points.
                </li>
                <li>
                    <strong className="glossary-term">Treasure</strong> - the three face-down secret cards dealt at the beginning of the game.
                </li>
                <li>
                    <strong className="glossary-term">Trick</strong> - one card from each player, played in clockwise order, during the playing phase.
                </li>
                <li>
                    <strong className="glossary-term">Trump Card</strong> - any card in the current trump suit.
                </li>
                <li>
                    <strong className="glossary-term">Trump [Suit]</strong> - a suit more powerful than the other suits, which must be played if a player does not have a card of the leading suit. A trump suit is declared through a marriage.
                </li>
            </ul>
        </section>
    </div>);
};

export default RulesView;