package ballware.keycloak.roleapi.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RoleUser {

    private String userId;
    private String roleId;

    public RoleUser() {

    }

    public RoleUser(String roleId, String userId) {
        this.userId = userId;
        this.roleId = roleId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String value) {
        this.userId = value;
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String value) {
        this.roleId = value;
    }
}
