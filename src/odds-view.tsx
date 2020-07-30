import * as React from "react";

export function OddsView(): JSX.Element {
    // calculate the odds of drawing some specific cards
    // for each "lone" marriage, calculate the odds of getting that particular mate
    // and calculate the overall odds of getting *some* card that you want

    // this is a specific card
    const loneProb = 1/17 + (16 / 17) * (1 / 16) +
        (15/16) * (1/15);

    // any one of 4 cards
    let firstTry = 4 / 17;
    let secondTry = (1 - firstTry) * 4 / 16;
    let thirdTry = (1 - firstTry - secondTry) * 4 / 15;
    const any4 = firstTry + secondTry + thirdTry;

    // any one of 3 cards
    firstTry = 3 / 17;
    secondTry = (1 - firstTry) * 3 / 16;
    thirdTry = (1 - firstTry - secondTry) * 3 / 15;
    const any3 = firstTry + secondTry + thirdTry;

    // any one of 2 cards
    firstTry = 2 / 17;
    secondTry = (1 - firstTry) * 2 / 16;
    thirdTry = (1 - firstTry - secondTry) * 2 / 15;
    const any2 = firstTry + secondTry + thirdTry;

    return (<div className="probabilities">
        <h2>Probabilities</h2>

        <table className="table table-sm table-striped table-bordered">
            <thead>
                <tr>
                    <th>Pr(drawing any of x cards) in treasure</th>
                    <th>Pr</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>{loneProb}</td>
                </tr>
                <tr>
                    <td>2</td>
                    <td>{any2}</td>
                </tr>
                <tr>
                    <td>3</td>
                    <td>{any3}</td>
                </tr>
                <tr>
                    <td>4</td>
                    <td>{any4}</td>
                </tr>
            </tbody>
        </table>
    </div>);
}