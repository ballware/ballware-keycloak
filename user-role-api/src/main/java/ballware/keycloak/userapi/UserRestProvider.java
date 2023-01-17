package ballware.keycloak.userapi;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.Encoded;
import javax.ws.rs.ForbiddenException;
import javax.ws.rs.GET;
import javax.ws.rs.NotAuthorizedException;
import javax.ws.rs.OPTIONS;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.apache.commons.lang.StringUtils;
import org.jboss.resteasy.annotations.cache.NoCache;
import org.jboss.resteasy.spi.HttpRequest;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.services.managers.AuthenticationManager.AuthResult;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.services.resources.Cors;
import org.keycloak.utils.MediaType;

import ballware.keycloak.userapi.model.User;
import ballware.keycloak.userapi.model.UserClaim;

public class UserRestProvider implements RealmResourceProvider {
    private final KeycloakSession session;
    private final AuthResult auth;
    
    public UserRestProvider(KeycloakSession session) {
        this.session = session;
        this.auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
    }

    public void close() {

    }

    public Object getResource() {
        return this;
    }

    @OPTIONS
	@Path("{any:.*}")
	public Response preflight() {
		HttpRequest request = session.getContext().getContextObject(HttpRequest.class);
		return Cors.add(request, Response.ok()).auth().allowedMethods("OPTIONS", "GET", "POST", "DELETE").preflight().build();
	}

    @GET
    @Path("all")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getAllUsers(String identifier) {
        
        String tenant = assertUserHasTenant();
        assertUserHasClaim("right", "identity.user.view");

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        return Cors.add(request, Response
            .ok(session.users().searchForUserStream(session.getContext().getRealm(), "")
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .map(e -> toUserDetail(e, 
                    e.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
                .collect(Collectors.toList()))
            ).auth().allowedOrigins(this.auth.getToken()).build();
    }

    @GET
    @Path("byId")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getUserById(
        @QueryParam("identifier") String identifier, 
        @QueryParam("id") String id) {
        
        String tenant = assertUserHasTenant();
        assertUserHasClaim("right", "identity.user.view");

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        UserModel user = session.users().getUserById(session.getContext().getRealm(), id);

        if (user != null && user.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            return Cors.add(request, Response
                .ok(this.toUserDetail(user,                
                    user.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowedOrigins(this.auth.getToken()).build();    
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowedOrigins(this.auth.getToken()).build();
    }


    @GET
    @Path("new")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getNewUser(String identifier) {
        
        assertUserHasTenant();
        assertUserHasClaim("right", "identity.user.add");
        
        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        return Cors.add(request, Response
            .ok(new User(UUID.randomUUID().toString(), "", "", "", null, null))
            ).auth().allowedOrigins(this.auth.getToken()).build();
    }

    @POST
    @Path("save")
    @NoCache
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Encoded
    public Response saveUser(
        @QueryParam("identifier") String identifier, User user) {

        String tenant = assertUserHasTenant();
        assertAuthenticatedUser();

        Map<String, List<String>> foldedClaims = new HashMap<String, List<String>>();

        if (user.getUserClaims() != null) {
            user.getUserClaims().forEach(cl -> {
                if (!"tenant".equals(cl.getClaimType())) {
                    if (!foldedClaims.containsKey(cl.getClaimType())) {
                        foldedClaims.put(cl.getClaimType(), new ArrayList<String>());
                    }

                    foldedClaims.get(cl.getClaimType()).add(cl.getClaimValue());
                }
            });
        }

        foldedClaims.put("tenant", Arrays.asList(new String[] { tenant }));
        
        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        UserModel existingUser = session.users().getUserById(session.getContext().getRealm(), user.getId());

        if (existingUser != null && existingUser.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            
            assertUserHasClaim("right", "identity.user.edit");

            existingUser.setFirstName(user.getFirstName());
            existingUser.setLastName(user.getLastName());

            foldedClaims.forEach((key, value) -> {
                existingUser.setAttribute(key, value);
            });

            return Cors.add(request, Response
                .ok(this.toUserDetail(existingUser,
                    existingUser.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowedOrigins(this.auth.getToken()).build();    
        } else if (existingUser == null) {
            assertUserHasClaim("right", "identity.user.add");

            UserModel newUser = session.users().addUser(session.getContext().getRealm(), user.getId(), user.getUserName(), true, true);
        
            foldedClaims.forEach((key, value) -> {
                newUser.setAttribute(key, value);
            });

            return Cors.add(request, Response
                .ok(this.toUserDetail(newUser,
                    newUser.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowedOrigins(this.auth.getToken()).build();   
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowedOrigins(this.auth.getToken()).build();
    }

    @DELETE
    @Path("remove/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @NoCache
    @Encoded
    public Response removeRole(
        @PathParam("id") String id) {

        String tenant = assertUserHasTenant();
        assertUserHasClaim("right", "identity.user.delete");

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        UserModel existingUser = session.users().getUserById(session.getContext().getRealm(), id);

        if (existingUser != null && existingUser.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            
            session.users().removeUser(session.getContext().getRealm(), existingUser);

            return Cors.add(request, Response
                .ok(this.toUserDetail(existingUser,
                    existingUser.getRealmRoleMappingsStream()
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
            ).auth().allowedOrigins(this.auth.getToken()).build();    
        }

        return Cors.add(request, Response
            .status(Status.NOT_FOUND)            
        ).auth().allowedOrigins(this.auth.getToken()).build();
    }

    private void assertAuthenticatedUser() {
        if (this.auth == null || this.auth.getToken() == null) {
            throw new NotAuthorizedException("Bearer");
        }
    }

    private String assertUserHasTenant() {

        assertAuthenticatedUser();

        String tenant = (String)this.auth.getToken().getOtherClaims().getOrDefault("tenant", null);

        if (StringUtils.isBlank(tenant)) {
            throw new ForbiddenException();
        }

        return tenant;
    }

    private void assertUserHasClaim(String claimType, String claimValue) {

        assert StringUtils.isNotBlank(claimType);
        assert StringUtils.isNotBlank(claimValue); 

        assertAuthenticatedUser();

        Object claimValues = this.auth.getToken().getOtherClaims().getOrDefault(claimType, null);

        boolean isList = claimValues instanceof List<?>;
        boolean hasClaim = isList ? ((List<?>)claimValues).contains(claimValue) : claimValue.equals(claimValues);

        if (!hasClaim) {
            throw new ForbiddenException();
        }
    }

    private User toUserDetail(UserModel um, List<RoleModel> assignedRoles) {

        List<UserClaim> claims = new ArrayList<UserClaim>();

        um.getAttributes().entrySet().forEach(entry -> {
            if (entry.getKey() != "tenant") {
                entry.getValue().forEach(value -> claims.add(new UserClaim(null, um.getId(), entry.getKey(), value)));
            }
        });

        String roleSummary = assignedRoles.stream().map(role -> role.getName()).collect(Collectors.joining(", "));

        return new User(um.getId(), um.getUsername(), um.getFirstName(), um.getLastName(), claims, roleSummary);
    }
}
