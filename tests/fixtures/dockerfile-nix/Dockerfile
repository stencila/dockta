FROM nixos/nix

# Copy over the Nix derivation
COPY default.nix .

# Run the Nix shell just to that all the 
# dependencies are downloaded into the /nix/store
RUN nix-shell --command ls

# Copy project sources
COPY main.py .

# Execute the sources in the Nix shell
CMD nix-shell --pure --command 'python3 main.py'
