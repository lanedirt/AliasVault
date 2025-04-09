package net.aliasvault.app.credentialmanager;

public class Credential {
    private String username;
    private String password;
    private String service;

    public Credential(String username, String password, String service) {
        this.username = username;
        this.password = password;
        this.service = service;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getService() {
        return service;
    }
} 