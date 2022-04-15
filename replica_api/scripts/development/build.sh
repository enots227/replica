#!/bin/bash
while getopts app: flag
do
    case "${flag}" in
        app) app=${OPTARG};;
    esac
done

if [ -z $app ] 
then
    app="app"
fi

pip3 install coverage
