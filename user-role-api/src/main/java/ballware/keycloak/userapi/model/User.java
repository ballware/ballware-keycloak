package ballware.keycloak.userapi.model;

public class User {
    private String userName;
    private String firstName;
    private String lastName;

    public User(String userName, String firstName, String lastName) {
        this.userName = userName;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getUserName() {
        return userName;
    }

    public String getLastName() {
        return lastName;
    }
}
