package ballware.keycloak.roleapi.model;

public class Role {
    private String id;
    private String displayName;

    public Role(String id, String displayName) {
        this.id = id;
        this.displayName = displayName;
    }

    public String getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }
}
