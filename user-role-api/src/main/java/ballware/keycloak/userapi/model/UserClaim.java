package ballware.keycloak.userapi.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class UserClaim {

    private String claimType;
    private String claimValue;

    private String id;
    private String roleId;

    public UserClaim() {

    }

    public UserClaim(String id, String roleId, String claimType, String claimValue) {
        this.id = id;
        this.roleId = roleId;
        this.claimType = claimType;
        this.claimValue = claimValue;
    }

    public String getId() {
        return id;
    }

    public void setId(String value) {
        this.id = value;
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String value) {
        this.roleId = value;
    }

    public String getClaimType() {
        return claimType;
    }

    public void setClaimType(String value) {
        this.claimType = value;
    }

    public String getClaimValue() {
        return claimValue;
    }

    public void setClaimValue(String value) {
        this.claimValue = value;
    }
}
