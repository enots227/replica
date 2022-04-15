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

curr_path=$(pwd)

app_dir="/usr/src/$app"

rm -r -f "$app_dir/htmlcov"
rm -r -f "$app_dir/.coverage"

cd $app_dir

export env='UNITTEST'

coverage run manage.py test --timing -v 2

export env='DEVELOPMENT'

mv ./.coverage ../.coverage

cd ..

coverage html

cd $curr_path
