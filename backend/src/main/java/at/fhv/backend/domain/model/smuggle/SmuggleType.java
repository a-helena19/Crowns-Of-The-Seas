package at.fhv.backend.domain.model.smuggle;

public enum SmuggleType {
    WAFFEN("Waffen"),
    SCHMUCK("Schmuck"),
    VERBOTENE_ARTEFAKTE("Verbotene Artefakte"),
    GEFÄLSCHTE_DOKUMENTE("Gefälschte Dokumente"),
    DROGEN("Drogen");

    private final String displayName;

    SmuggleType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
