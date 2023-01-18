package ballware.keycloak.userapi.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSetter;

@JsonIgnoreProperties(ignoreUnknown = true)
public class User {
    private String id;
    private String userName;
    private String email;
    private String firstName;
    private String lastName;

    private List<UserClaim> claims;
    private List<UserRole> roles;
    private String roleSummary;

    public User() {

    }

    public User(String id, String userName, String email, String firstName, String lastName, List<UserClaim> claims, List<UserRole> roles, String roleSummary) {
        this.id = id;
        this.userName = userName;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.claims = claims;
        this.roles = roles;
        this.roleSummary = roleSummary;
    }

    public String getId() {
        return id;
    }

    public void setId(String value) {
        this.id = value;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String value) {
        this.firstName = value;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String value) {
        this.userName = value;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String value) {
        this.email = value;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String value) {
        this.lastName = value;
    }

    public String getRoleSummary() {
        return roleSummary;
    }

    public void setRoleSummary(String value) {
        this.roleSummary = value;
    }

    @JsonGetter("userClaims")
    public List<UserClaim> getUserClaims() {
        return claims;
    }

    @JsonSetter("userClaims")
    public void setUserClaims(List<UserClaim> value) {
        this.claims = value;
    }

    @JsonGetter("roles")
    public List<UserRole> getUserRoles() {
        return roles;
    }

    @JsonSetter("roles")
    public void setUserRoles(List<UserRole> value) {
        this.roles = value;
    }
}
