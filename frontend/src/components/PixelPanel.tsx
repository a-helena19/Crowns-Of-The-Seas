import "../style/harbor.css"

type PixelPanelProps = {
    children: React.ReactNode;
    className?: string;
};

export default function PixelPanel({ children, className = "" }: PixelPanelProps) {
    return (
        <div className={`pixel-panel ${className}`}>
            {children}
        </div>
    );
}