import type { ReactNode } from "react";

export function Field(props: { label?: ReactNode; children: ReactNode; className?: string }) {
    const { label, children, className } = props;

    return (
        <div className={className !== undefined ? `dx-field ${className}` : "dx-field"}>
            {label !== undefined && <div className="dx-field-label">{label}</div>}
            <div className="dx-field-value">{children}</div>
        </div>
    );
}

export function FieldStatic(props: { label?: ReactNode; children: ReactNode; className?: string }) {
    const { label, children, className } = props;

    return (
        <div className={className !== undefined ? `dx-field ${className}` : "dx-field"}>
            {label !== undefined && <div className="dx-field-label">{label}</div>}
            <div className="dx-field-value-static">{children}</div>
        </div>
    );
}

export function FieldRow(props: { children: ReactNode }) {
    return <div className="dx-field kc-field-row">{props.children}</div>;
}

export function Spacer() {
    return <div className="kc-spacer" />;
}

export function Instruction(props: { children: ReactNode }) {
    return <p className="instruction">{props.children}</p>;
}
