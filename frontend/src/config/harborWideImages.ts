import hamburg    from "../assets/harbors-wide/Hamburg.png";
import newYork    from "../assets/harbors-wide/New_York.png";
import santos     from "../assets/harbors-wide/Santos.png";
import kapstadt    from "../assets/harbors-wide/Kapstadt.png";
import mumbai     from "../assets/harbors-wide/Mumbai.png";
import singapur   from "../assets/harbors-wide/Singapur.png";
import shanghai   from "../assets/harbors-wide/Shanghai.png";
import sydney     from "../assets/harbors-wide/Sydney.png";
import losAngeles from "../assets/harbors-wide/Los_Angeles.png";

const HARBOR_WIDE_IMAGES: Record<string, string> = {
    "Hamburg": hamburg,
    "New York": newYork,
    "Santos": santos,
    "Kapstadt": kapstadt,
    "Mumbai": mumbai,
    "Singapur": singapur,
    "Shanghai": shanghai,
    "Sydney": sydney,
    "Los Angeles": losAngeles,
};

export function getHarborWideImage(portName: string): string | undefined {
    return HARBOR_WIDE_IMAGES[portName];
}

export default HARBOR_WIDE_IMAGES;
