import React, { FC } from "react";

interface IProps {
    /**
     * Name for the input radio element
     */
    radioName: string;

    /**
     * ID for the container
     */
    containerId: string;

    /**
     * Labels for each of the radio buttons (what we show)
     */
    humanLabels: string[];

    /**
     * Labels for each of the radio buttons (what we submit)
     */
    labels: string[];

    /**
     * Labels which should be disabled
     */
    disabledLabels?: string[];

    /**
     * The currently selected label
     */
    checkedLabel: string;

    /**
     * Handler
     */
    onChange(label: string): void;
};

export const RadioButtonGroup: FC<IProps> = (props: IProps) => {
    function handleChange(e: React.SyntheticEvent<HTMLInputElement>) {
        const v = (e.target as HTMLInputElement).value;
        props.onChange(v);
    }

    const buttons = props.labels.map((label: string, i: number) => {
        let classes = "btn btn-outline-success btn-lg";
        if (label === props.checkedLabel) {
            classes += " active";
        }
        if (props.disabledLabels && props.disabledLabels.includes(label)) {
            classes += " disabled";
        }

        return <label className={classes} key={label}>
            <input type="radio" name={props.radioName} value={label}
                disabled={props.disabledLabels && props.disabledLabels.includes(label)}
                checked={label === props.checkedLabel}
                onChange={handleChange} /> {props.humanLabels[i]}
        </label>
    });

    return (<div className="btn-group btn-group-toggle" data-toggle="buttons" id={props.containerId}>
        { buttons }
    </div>);
}

export default RadioButtonGroup;