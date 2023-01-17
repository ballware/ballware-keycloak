package ballware.keycloak.userapi.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserRole {

    private String userId;
    private String roleId;

    public UserRole() {

    }

    public UserRole(String userId, String roleId) {
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
