import { useSpriteAnimation } from ".././hooks/useSpriteAnimation";
import "../style/sailor.css";

import sailor1 from "../assets/sailor/sailor1.png";
import sailor2 from "../assets/sailor/sailor2.png";
import sailor3 from "../assets/sailor/sailor3.png";

export default function Sailor() {
    const frames = [
        sailor1,
        sailor2,
        sailor3
    ];

    const currentFrame = useSpriteAnimation(frames, 800);
    return (
        <img
            src={currentFrame}
            className="sailor"
            alt={"Sailor animation frame"}
        />
    );
}