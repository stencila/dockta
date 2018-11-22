{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
    buildInputs = with pkgs; [
        python35
    ];
}
