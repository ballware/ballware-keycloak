package ballware.keycloak.roleapi.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSetter;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Role {
    private String id;
    private String displayName;
    private List<RoleClaim> claims;
    private List<RoleUser> users;
    private String userSummary;

    public Role() {

    }

    public Role(String id, String displayName, List<RoleClaim> claims, List<RoleUser> users, String userSummary) {
        this.id = id;
        this.displayName = displayName;
        this.claims = claims;
        this.users = users;
        this.userSummary = userSummary;
    }

    public String getId() {
        return id;
    }

    public void setId(String value) {
        this.id = value;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String value) {
        this.displayName = value;
    }

    public String getUserSummary() {
        return userSummary;
    }

    public void setUserSummary(String value) {
        this.userSummary = value;
    }

    @JsonGetter("roleClaims")
    public List<RoleClaim> getRoleClaims() {
        return claims;
    }

    @JsonSetter("roleClaims")
    public void setRoleClaims(List<RoleClaim> value) {
        this.claims = value;
    }

    @JsonGetter("users")
    public List<RoleUser> getRoleUsers() {
        return users;
    }

    @JsonSetter("users")
    public void setRoleUsers(List<RoleUser> value) {
        this.users = value;
    }
}
