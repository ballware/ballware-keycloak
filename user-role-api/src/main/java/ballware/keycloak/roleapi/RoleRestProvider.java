package ballware.keycloak.roleapi;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.services.managers.AuthenticationManager.AuthResult;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.services.cors.Cors;
import org.keycloak.utils.MediaType;

import ballware.keycloak.roleapi.model.Role;
import ballware.keycloak.roleapi.model.RoleClaim;
import ballware.keycloak.roleapi.model.RoleSelectlistEntry;
import ballware.keycloak.roleapi.model.RoleUser;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Encoded;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.ext.Provider;

@Provider
public class RoleRestProvider implements RealmResourceProvider {
    private final KeycloakSession session;
    private final AuthResult auth;
    
    public RoleRestProvider(KeycloakSession session) {
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
		return Cors.builder()
            .allowedMethods("OPTIONS", "GET", "POST", "DELETE")
            .exposedHeaders(Cors.AUTHORIZATION_HEADER)
            .auth()
            .preflight()
            .add(Response.ok());
	}

    @GET
    @Path("all")
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getAllRoles(@QueryParam("identifier") String identifier) {
        
        String tenant = assertUserHasTenant();

        if (!(userHasClaim("right", "identity.role.view") || userHasClaim("right", "tenant.role.view"))) {
            throw new ForbiddenException();
        }

        return Cors.builder().auth().allowAllOrigins().add(Response
            .ok(session.roles().searchForRolesStream(session.getContext().getRealm(), "", null, null)
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .map(e -> toRoleDetail(e, 
                    session.users().getRoleMembersStream(session.getContext().getRealm(), e)
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                ))
                .collect(Collectors.toList())));
    }

    @GET
    @Path("byId")
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getRoleById(
        @QueryParam("identifier") String identifier, 
        @QueryParam("id") String id) {
        
        String tenant = assertUserHasTenant();
        
        if (!(userHasClaim("right", "identity.role.view") || userHasClaim("right", "tenant.role.view"))) {
            throw new ForbiddenException();
        }

        RoleModel role = session.roles().getRoleById(session.getContext().getRealm(), id);

        if (role != null && role.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            return Cors.builder().auth().allowAllOrigins().add(Response
                .ok(this.toRoleDetail(role,
                    session.users().getRoleMembersStream(session.getContext().getRealm(), role)
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                )));    
        }

        return Cors.builder().auth().allowAllOrigins().add(Response
            .status(Status.NOT_FOUND));
    }

    @GET
    @Path("new")
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getNewRole(@QueryParam("identifier") String identifier) {
        
        assertUserHasTenant();
        
        if (!(userHasClaim("right", "identity.role.add") || userHasClaim("right", "tenant.role.add"))) {
            throw new ForbiddenException();
        }
        

        return Cors.builder().auth().allowAllOrigins().add(Response
            .ok(new Role(UUID.randomUUID().toString(), "", null, null, null)));
    }

    @POST
    @Path("save")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Encoded
    public Response saveRole(
        @QueryParam("identifier") String identifier, Role role) {

        String tenant = assertUserHasTenant();
        assertAuthenticatedUser();

        Map<String, List<String>> foldedClaims = new HashMap<String, List<String>>();

        if (role.getRoleClaims() != null) {
            role.getRoleClaims().forEach(cl -> {
                if (!"tenant".equals(cl.getClaimType())) {
                    if (!foldedClaims.containsKey(cl.getClaimType())) {
                        foldedClaims.put(cl.getClaimType(), new ArrayList<String>());
                    }

                    foldedClaims.get(cl.getClaimType()).add(cl.getClaimValue());
                }
            });
        }

        foldedClaims.put("tenant", Arrays.asList(new String[] { tenant }));
        

        RoleModel existingRole = session.roles().getRoleById(session.getContext().getRealm(), role.getId());

        if (existingRole != null && existingRole.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            
            if (!(userHasClaim("right", "identity.role.edit") || userHasClaim("right", "tenant.role.edit"))) {
                throw new ForbiddenException();
            }

            existingRole.setName(role.getDisplayName());

            foldedClaims.forEach((key, value) -> {
                existingRole.setAttribute(key, value);
            });

            if (role.getRoleUsers() != null) {
                List<String> newUsers = role.getRoleUsers().stream().map(r -> r.getUserId()).collect(Collectors.toList());

                List<String> existingUsers = session.users().getRoleMembersStream(session.getContext().getRealm(), existingRole)
                    .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                    .map(r -> r.getId())
                    .collect(Collectors.toList());

                existingUsers.forEach(user -> {
                    if (!newUsers.contains(user)) {
                        UserModel existingUser = session.users().getUserById(session.getContext().getRealm(), user);
                    
                        existingUser.deleteRoleMapping(existingRole);
                    }
                });

                newUsers.forEach(user -> {
                    UserModel newUser = session.users().getUserById(session.getContext().getRealm(), user);
                    
                    if (newUser != null && !existingUsers.contains(newUser.getId())) {
                        newUser.grantRole(existingRole);
                    }
                });
            } 

            return Cors.builder().auth().allowAllOrigins().add(Response
                .ok(this.toRoleDetail(existingRole,
                    session.users().getRoleMembersStream(session.getContext().getRealm(), existingRole)
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                )));    
        } else if (existingRole == null) {
            if (!(userHasClaim("right", "identity.role.add") || userHasClaim("right", "tenant.role.add"))) {
                throw new ForbiddenException();
            }

            RoleModel newRole = session.roles().addRealmRole(session.getContext().getRealm(), role.getDisplayName());
        
            foldedClaims.forEach((key, value) -> {
                newRole.setAttribute(key, value);
            });

            if (role.getRoleUsers() != null) {
                role.getRoleUsers().forEach(user -> {
                    UserModel newUser = session.users().getUserById(session.getContext().getRealm(), user.getUserId());
                    newUser.grantRole(newRole);
                });
            } 

            return Cors.builder().auth().allowAllOrigins().add(Response
                .ok(this.toRoleDetail(newRole,
                    session.users().getRoleMembersStream(session.getContext().getRealm(), newRole)
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                )));   
        }

        return Cors.builder().auth().allowAllOrigins().add(Response
            .status(Status.NOT_FOUND));
    }

    @DELETE
    @Path("remove/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @Encoded
    public Response removeRole(
        @PathParam("id") String id) {

        String tenant = assertUserHasTenant();

        if (!(userHasClaim("right", "identity.role.delete") || userHasClaim("right", "tenant.role.delete"))) {
            throw new ForbiddenException();
        }

        RoleModel existingRole = session.roles().getRoleById(session.getContext().getRealm(), id);

        if (existingRole != null && existingRole.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            
            session.roles().removeRole(existingRole);

            return Cors.builder().auth().allowAllOrigins().add(Response
                .ok(this.toRoleDetail(existingRole,
                    session.users().getRoleMembersStream(session.getContext().getRealm(), existingRole)
                        .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                        .collect(Collectors.toList())
                )));    
        }

        return Cors.builder().auth().allowAllOrigins().add(Response
            .status(Status.NOT_FOUND));
    }

    @GET
    @Path("selectlist")
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getSelect() {
        
        String tenant = assertUserHasTenant();

        if (!(userHasClaim("right", "identity.role.view") || userHasClaim("right", "tenant.role.view"))) {
            throw new ForbiddenException();
        }

        return Cors.builder().auth().allowAllOrigins().add(Response
            .ok(session.roles().searchForRolesStream(session.getContext().getRealm(), "", null, null)
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .map(e -> new RoleSelectlistEntry(e.getId(), e.getName()))
                .collect(Collectors.toList())));
    }

    @GET
    @Path("selectbyid/{id}")
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getSelectById(
        @PathParam("id") String id) {
        
        String tenant = assertUserHasTenant();
        
        if (!(userHasClaim("right", "identity.role.view") || userHasClaim("right", "tenant.role.view"))) {
            throw new ForbiddenException();
        }

        RoleModel role = session.roles().getRoleById(session.getContext().getRealm(), id);

        if (role != null && role.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant)) {
            return Cors.builder().auth().allowAllOrigins().add(Response
                .ok(new RoleSelectlistEntry(role.getId(), role.getName())));    
        }

        return Cors.builder().auth().allowAllOrigins().add(Response
            .status(Status.NOT_FOUND));
    }

    private Role toRoleDetail(RoleModel rm, List<UserModel> assignedUser) {

        List<RoleClaim> claims = new ArrayList<RoleClaim>();

        rm.getAttributes().entrySet().forEach(entry -> {
            if (entry.getKey() != "tenant") {
                entry.getValue().forEach(value -> claims.add(new RoleClaim(null, rm.getId(), entry.getKey(), value)));
            }
        });

        List<RoleUser> users = assignedUser.stream().map(au -> new RoleUser(rm.getId(), au.getId())).collect(Collectors.toList());

        String userSummary = assignedUser.stream().map(user -> user.getUsername()).collect(Collectors.joining(", "));

        return new Role(
            rm.getId(), 
            rm.getName(),
            claims,
            users,
            userSummary
        );
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

    private boolean userHasClaim(String claimType, String claimValue) {

        assert StringUtils.isNotBlank(claimType);
        assert StringUtils.isNotBlank(claimValue); 

        assertAuthenticatedUser();

        Object claimValues = this.auth.getToken().getOtherClaims().getOrDefault(claimType, null);

        boolean isList = claimValues instanceof List<?>;
        boolean hasClaim = isList ? ((List<?>)claimValues).contains(claimValue) : claimValue.equals(claimValues);

        return hasClaim;
    }
}
