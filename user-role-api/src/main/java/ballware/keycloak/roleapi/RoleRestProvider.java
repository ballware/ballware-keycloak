package ballware.keycloak.roleapi;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.ws.rs.Encoded;
import javax.ws.rs.GET;
import javax.ws.rs.NotAuthorizedException;
import javax.ws.rs.OPTIONS;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Response;

import org.jboss.resteasy.annotations.cache.NoCache;
import org.jboss.resteasy.spi.HttpRequest;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RoleModel;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.services.managers.AuthenticationManager.AuthResult;
import org.keycloak.services.resource.RealmResourceProvider;
import org.keycloak.services.resources.Cors;
import org.keycloak.utils.MediaType;

import ballware.keycloak.roleapi.model.Role;

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
		HttpRequest request = session.getContext().getContextObject(HttpRequest.class);
		return Cors.add(request, Response.ok()).auth().preflight().build();
	}

    @GET
    @Path("all")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getAllRoles(String identifier) {
        if (this.auth == null || this.auth.getToken() == null) {
            throw new NotAuthorizedException("Bearer");
        }

        String tenant = this.auth.getToken().getOtherClaims().getOrDefault("tenant", "undefined").toString();

        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        return Cors.add(request, Response
            .ok(session.roles().searchForRolesStream(session.getContext().getRealm(), "", null, null)
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .map(e -> toRoleDetail(e))
                .collect(Collectors.toList()))
            ).auth().allowedOrigins(this.auth.getToken()).build();
    }

    @GET
    @Path("byId")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getRoleById(String identifier, String id) {
        if (this.auth == null || this.auth.getToken() == null) {
            throw new NotAuthorizedException("Bearer");
        }

        String tenant = this.auth.getToken().getOtherClaims().getOrDefault("tenant", "undefined").toString();
        
        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        return Cors.add(request, Response
            .ok(session.roles().searchForRolesStream(session.getContext().getRealm(), "", null, null)
                .filter(r -> r.getAttributes().getOrDefault("tenant", new ArrayList<String>()).contains(tenant))
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .map(e -> toRoleDetail(e)))
            ).auth().allowedOrigins(this.auth.getToken()).build();
    }


    @GET
    @Path("new")
    @NoCache
    @Produces({MediaType.APPLICATION_JSON})
    @Encoded
    public Response getNewRole(String identifier) {
        if (this.auth == null || this.auth.getToken() == null) {
            throw new NotAuthorizedException("Bearer");
        }
        
        HttpRequest request = session.getContext().getContextObject(HttpRequest.class);

        return Cors.add(request, Response
            .ok(new Role(UUID.randomUUID().toString(), ""))
            ).auth().allowedOrigins(this.auth.getToken()).build();
    }

    private Role toRoleDetail(RoleModel rm) {
        return new Role(rm.getId(), rm.getName());
    } 
}
