import React, {FC} from "react";
import {Bid} from "../game-mechanics";

interface IProps {
    playerNames: string[];
    /**
     * Index into playerNames
     */
    startingBidPlayer: number;

    bidHistory: Bid[];
};

const BidHistoryView : FC<IProps> = (props: IProps) => {
    function bidTableCell(bid: Bid, index: number): JSX.Element {
        return <td key={`bid-${index}`}>
            {bid.points > 0 ? bid.points : "pass"}
        </td>;
    }

    const tableHeader = [
        <th key={'blank'}>round</th>
    ] as JSX.Element[];
    for (let i = 0; i < 3; i++) {
        const name = props.playerNames[(props.startingBidPlayer + i) % 3];
        tableHeader.push(
            <th key={`name-${i}`}>{ name }</th>
        );
    }

    const rows = [] as JSX.Element[];
    // this is the number for the *next* row
    let roundNum = 1;
    // these are the cells that have not yet been added to a row
    let elems = [] as JSX.Element[];

    for(let i = 0; i < props.bidHistory.length; i++) {
        if (elems.length === 3) {
            let row = <tr key={`round-${roundNum}`}>
                <td>{roundNum}</td>
                { elems }
            </tr>;
            rows.push(row);
            roundNum++;
            elems = [];
        }
        let bid = props.bidHistory[i];
        elems.push(bidTableCell(bid, i));
    }
    // add any remaining
    if (elems.length > 0) {
        // if there are not exactly a multiple of 3 then will out the rest of the table cells with blanks
        let i = 0;
        while (elems.length < 3) {
            elems.push(<td key={`blank-${i}`}></td>);
            i++;
        }
        let row = <tr key={`round-${roundNum}`}>
            <td>{roundNum}</td>
            { elems }
        </tr>;
        rows.push(row);
    }

    return <div className="bid-history">
        <h2>Bidding History</h2>
        {props.bidHistory.length === 0 ?
            <p>no bids yet</p> :
            <table className="table table-striped table-sm">
                <thead>
                    <tr>{tableHeader}</tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        }
    </div>;
};

export {
    BidHistoryView,
};