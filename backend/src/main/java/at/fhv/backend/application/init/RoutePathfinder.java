package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.port.Coordinates;

import java.util.*;

public final class RoutePathfinder {
    private record Edge(String to, List<double[]> waypoints, double weight) {}
    private static final Map<String, List<Edge>> GRAPH = new HashMap<>();
    private static final Map<String, double[]> PORTS = new HashMap<>();
    private static final Map<String, double[]> HUBS = new HashMap<>();
    private static final Map<String, String> ROUTE_DESCRIPTIONS = new HashMap<>();

    static {
        port("Hamburg",     47.1, 28.6);
        port("Rotterdam",   46.3, 29.5);
        port("New York",    26.1, 37.7);
        port("Santos",      33.9, 71.4);
        port("Kapstadt",    50.0, 77.1);
        port("Mumbai",      63.7, 50.0);
        port("Singapur",    70.9, 58.0);
        port("Shanghai",    75.0, 43.0);
        port("Sydney",      82.1, 80.2);
        port("Los Angeles", 15.4, 40.2);

        hub("Atlantic Crossroads", 34.9, 48.6);
        hub("Second Atlantic Crossroad", 38.0, 63.8);
        hub("Indian Ocean Hub", 64.8, 62.9);
        hub("Phillipinen Hub", 82.6, 55.7);
        hub("Biskaya Hub", 40.1, 31.5);
        hub("Santos Hub", 34.3, 73.2);

        edge("Santos", "Santos Hub", wp(33.9, 71.4), wp(34.3, 73.2));
        edge("Santos Hub", "Second Atlantic Crossroad", wp(34.3, 73.2), wp(38.0, 63.8));
        edge("Second Atlantic Crossroad", "Atlantic Crossroads", wp(38.0, 63.8), wp(34.9, 48.6));
        edge("Second Atlantic Crossroad", "Kapstadt",  wp(38.0, 63.8), wp(50.0, 77.1));
        edge("Rotterdam", "Biskaya Hub", wp(46.3, 29.5), wp(40.1, 31.5));
        edge("Biskaya Hub", "Atlantic Crossroads", wp(40.1, 31.5), wp(34.9, 48.6));
        edge("Atlantic Crossroads", "Los Angeles", wp(34.9, 48.6), wp(25.5, 51.8), wp(25.0, 57.6), wp(15.4, 49.2), wp(15.4, 40.2));
        edge("Santos", "Santos Hub", wp(33.9, 71.4), wp(34.3, 73.2));
        edge("Santos Hub", "Kapstadt", wp(34.3, 73.2), wp(50.0, 77.1));
        edge("Atlantic Crossroads", "New York", wp(34.9, 48.6), wp(26.1, 39.7));
        edge("Hamburg", "Rotterdam", wp(47.1, 28.6), wp(46.3, 29.5));
        edge("Mumbai", "Biskaya Hub", wp(63.7, 50.0), wp(57.6, 52.1), wp(56.1, 53.3), wp(53.0, 41.4), wp(47.5, 38.1), wp(42.3, 40.1), wp(39.9, 31.3), wp(40.1, 31.5));
        edge("Mumbai", "Indian Ocean Hub", wp(63.7, 50.0), wp(63.2, 53.3), wp(64.8, 62.9));
        edge("Singapur", "Indian Ocean Hub",  wp(70.9, 58.0), wp(73.4, 62.3), wp(77.8, 63.3), wp(76.7, 66.2), wp(64.8, 62.9));
        edge("Singapur", "Phillipinen Hub", wp(70.9, 58.0), wp(74.4, 54.3), wp(82.6, 55.7));
        edge("Sydney", "Indian Ocean Hub", wp(82.1, 82.2), wp(74.4, 82.9),  wp(64.8, 62.9));
        edge("Sydney", "Phillipinen Hub", wp(82.1, 82.2), wp(85.9, 72.8), wp(82.6, 55.7));
        edge("Shanghai", "Phillipinen Hub", wp(75.0, 43.0), wp(82.6, 55.7));
        edge("Kapstadt", "Indian Ocean Hub", wp(50.0, 77.1), wp(50.2, 80.4), wp(56.3, 77.5), wp(64.8, 62.9));

        routeDesc("Hamburg", "Mumbai",     "Reise über den Suezkanal. Oft erlebt man hier schlechte Wetterbedingungen.");
        routeDesc("Mumbai", "Rotterdam",   "Reise über den Suezkanal. Oft erlebt man hier schlechte Wetterbedingungen.");
        routeDesc("Hamburg", "Singapur",   "Lange Passage durch Mittelmeer und Suezkanal. Erfahrene Kapitäne empfohlen.");
        routeDesc("Rotterdam", "Singapur", "Lange Passage durch Mittelmeer und Suezkanal. Erfahrene Kapitäne empfohlen.");
        routeDesc("Hamburg", "Shanghai",   "Klassische Ostasien-Route über Suezkanal und Indischen Ozean.");
        routeDesc("Hamburg", "Sydney",     "Eine der längsten Strecken — durch Suez und über den Indischen Ozean.");
        routeDesc("Hamburg", "New York",   "Bewährte Atlantikroute. Stabile Winde, vorhersehbare Reisedauer.");
        routeDesc("New York", "Rotterdam", "Bewährte Atlantikroute. Stabile Winde, vorhersehbare Reisedauer.");
        routeDesc("Los Angeles", "New York", "Über die Karibik und durch den Panamakanal.");
        routeDesc("Los Angeles", "Santos", "Lange Strecke entlang der pazifischen Küste, vorbei am Panamakanal.");
        routeDesc("Kapstadt", "Santos",    "Direkter Atlantikübergang, oft begleitet von rauer See.");
        routeDesc("Kapstadt", "Singapur",  "Reise durch den Indischen Ozean — Vorsicht vor Monsunwinden.");
        routeDesc("Kapstadt", "Sydney",    "Südliche Passage entlang des 40. Breitengrads. Kalt aber zuverlässig.");
        routeDesc("Mumbai", "Singapur",    "Kurze Passage durch den Golf von Bengalen.");
        routeDesc("Singapur", "Shanghai",  "Geschäftige Route durch das Südchinesische Meer.");
        routeDesc("Shanghai", "Sydney",    "Pazifische Inselroute mit traumhaften Sonnenuntergängen.");
        routeDesc("Singapur", "Sydney",    "Reise durch die indonesische Inselwelt nach Australien.");

    }

    private static void routeDesc(String a, String b, String desc) {
        String key = a.compareTo(b) < 0 ? a + "|" + b : b + "|" + a;
        ROUTE_DESCRIPTIONS.put(key, desc);
    }

    public static String getRouteDescription(String fromName, String toName) {
        String key = fromName.compareTo(toName) < 0
                ? fromName + "|" + toName
                : toName + "|" + fromName;
        return ROUTE_DESCRIPTIONS.getOrDefault(key,
                "Seeroute von " + fromName + " nach " + toName + ". Eine ruhige, gut befahrene Strecke.");
    }

    private static void port(String name, double x, double y) {
        PORTS.put(name, new double[]{x, y});
    }

    private static void hub(String name, double x, double y) {
        HUBS.put(name, new double[]{x, y});
    }

    private static double[] nodePos(String name) {
        double[] p = PORTS.get(name);
        return p != null ? p : HUBS.get(name);
    }

    private static double[] wp(double x, double y) {
        return new double[]{x, y};
    }

    private static void edge(String a, String b, double[]... waypoints) {
        List<double[]> wpList = Arrays.asList(waypoints);
        double weight = pathLength(nodePos(a), wpList, nodePos(b));
        GRAPH.computeIfAbsent(a, k -> new ArrayList<>()).add(new Edge(b, wpList, weight));
        List<double[]> reversed = new ArrayList<>(wpList);
        Collections.reverse(reversed);
        GRAPH.computeIfAbsent(b, k -> new ArrayList<>()).add(new Edge(a, reversed, weight));
    }

    private static double pathLength(double[] from, List<double[]> waypoints, double[] to) {
        double total = 0;
        double[] prev = from;
        for (double[] wp : waypoints) {
            total += Math.hypot(wp[0] - prev[0], wp[1] - prev[1]);
            prev = wp;
        }
        total += Math.hypot(to[0] - prev[0], to[1] - prev[1]);
        return total;
    }

    private RoutePathfinder() {
    }

    public static List<Coordinates> findRoute(Coordinates origin, Coordinates destination) {
        String originName = nameOf(origin);
        String destName = nameOf(destination);
        if (originName == null || destName == null || originName.equals(destName)) {
            return List.of();
        }

        List<String> nodePath = aStar(originName, destName);
        if (nodePath == null || nodePath.size() < 2) {
            return List.of();
        }

        List<Coordinates> result = new ArrayList<>();
        for (int i = 0; i < nodePath.size() - 1; i++) {
            String a = nodePath.get(i);
            String b = nodePath.get(i + 1);
            Edge edge = findEdge(a, b);
            if (edge == null) return List.of();

            List<double[]> wps = edge.waypoints;

            int start = 1;
            int end = (i < nodePath.size() - 2)
                    ? wps.size()
                    : wps.size() - 1;

            for (int w = start; w < end; w++) {
                double[] point = wps.get(w);
                result.add(Coordinates.of(point[0], point[1]));
            }
        }
        return result;
    }

    private static Edge findEdge(String from, String to) {
        for (Edge e : GRAPH.getOrDefault(from, List.of())) {
            if (e.to.equals(to)) return e;
        }
        return null;
    }

    private static List<String> aStar(String start, String goal) {
        double[] goalPos = nodePos(goal);
        Map<String, Double> gScore = new HashMap<>();
        Map<String, String> cameFrom = new HashMap<>();
        gScore.put(start, 0.0);

        PriorityQueue<String> open = new PriorityQueue<>(
                Comparator.comparingDouble(n -> gScore.getOrDefault(n, Double.MAX_VALUE)
                        + heuristic(nodePos(n), goalPos))
        );
        open.add(start);
        Set<String> closed = new HashSet<>();

        while (!open.isEmpty()) {
            String current = open.poll();
            if (current.equals(goal)) {
                return reconstructPath(cameFrom, current);
            }
            closed.add(current);

            for (Edge edge : GRAPH.getOrDefault(current, List.of())) {
                if (closed.contains(edge.to)) continue;
                double tentative = gScore.getOrDefault(current, Double.MAX_VALUE) + edge.weight;
                if (tentative < gScore.getOrDefault(edge.to, Double.MAX_VALUE)) {
                    cameFrom.put(edge.to, current);
                    gScore.put(edge.to, tentative);
                    if (!open.contains(edge.to)) {
                        open.add(edge.to);
                    }
                }
            }
        }
        return null;
    }

    private static double heuristic(double[] a, double[] b) {
        return Math.hypot(a[0] - b[0], a[1] - b[1]);
    }

    private static List<String> reconstructPath(Map<String, String> cameFrom, String current) {
        List<String> path = new ArrayList<>();
        path.add(current);
        while (cameFrom.containsKey(current)) {
            current = cameFrom.get(current);
            path.add(0, current);
        }
        return path;
    }

    private static String nameOf(Coordinates c) {
        double x = c.getX();
        double y = c.getY();
        for (Map.Entry<String, double[]> entry : PORTS.entrySet()) {
            double[] p = entry.getValue();
            if (Math.abs(p[0] - x) < 0.5 && Math.abs(p[1] - y) < 0.5) {
                return entry.getKey();
            }
        }
        return null;
    }
}