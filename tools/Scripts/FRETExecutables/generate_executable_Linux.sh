cd /tmp
if [ -d "FRET_PACK" ]; then rm -rf FRET_PACK; fi
mkdir FRET_PACK
cd FRET_PACK
git clone  https://github.com/NASA-SW-VnV/fret.git
#git clone ssh://babelfish.ndc.nasa.gov/git/fret

cd fret

##Set the branch that you want to package, e.g.,:
#git checkout realizability

cd fret-electron
mv docs app
mv ../tools app

#analysis folder has been introduced with the realizability branch. Check if it exists.
if [ -d "analysis" ]; then
	mv analysis app;
fi

cd app;
mv components/Grammar.js x.js;
sed -e 's+Page from '\''\.\./\.\./docs/_media+Page from '\''../docs/_media+' x.js >components/Grammar.js;
rm x.js;
mv components/Instructions.js x.js;
sed -e 's+\.\./docs/+docs/+' -e 's+from '\''examples+from '\''docs/_media/user-interface/examples+' x.js > components/Instructions.js;
rm x.js;
mv components/SlateEditor2.js x.js; 
sed -e 's+\.\./docs/+docs/+' x.js > components/SlateEditor2.js;
rm x.js;

FILERC=components/RealizabilityContent.js;
if test -f "$FILERC"; then
 mv components/RealizabilityContent.js x.js;
 sed -e 's+\.\./\.\./analysis/+analysis/+' x.js > components/RealizabilityContent.js;
 mv components/RealizabilityContent.js x.js;
 sed -e 's+\.\./docs/+docs/+' x.js > components/RealizabilityContent.js;
 rm x.js;
fi

FILERC=components/TestGenContent.js;
if test -f "$FILERC"; then 
 mv components/TestGenContent.js x.js;
 sed -e 's+\.\./docs/+docs/+' x.js > components/TestGenContent.js;
 rm x.js;
fi

FILEDE=analysis/DiagnosisEngine.js;
if test -f "$FILEDE"; then
 mv analysis/DiagnosisEngine.js x.js;
 sed -e 's+\.\./support/+../../support/+' x.js > analysis/DiagnosisEngine.js;
 rm x.js;
 mv analysis/DiagnosisEngine.js x.js;
 sed -e 's+\.\./app/+../../app/+' x.js > analysis/DiagnosisEngine.js;
 rm x.js;
fi

FILEDE=components/VariablesView.js;
if test -f "$FILERC"; then
 mv components/VariablesView.js x.js;
 sed -e 's+\.\./docs/+docs/+' x.js > components/VariablesView.js;
 rm x.js;
fi

mv package.json x.json; 
sed -e 's+\.\./\.\./tools/LTLSIM+tools/LTLSIM+' x.json > package.json;
rm x.json;
mv tools/LTLSIM/ltlsim-core/package.json x.json; 
sed -e 's+fret-electron/support/NuSMVParser+../support/NuSMVParser+' x.json > tools/LTLSIM/ltlsim-core/package.json;
rm x.json;
mv tools/LTLSIM/ltlsim-core/package.json x.json;
sed -e 's+fret-electron/support/LTLSIM_NuSMVParser+../support/LTLSIM_NuSMVParser+' x.json > tools/LTLSIM/ltlsim-core/package.json;
rm x.json;


cd ..

mv model/realizabilitySupport/realizabilityUtils.js x.js;
sed -e 's+\.\./\.\./analysis/+analysis/+' x.js > model/realizabilitySupport/realizabilityUtils.js;
rm x.js;

mv package.json x.json;
sed -e 's+docs/_media+app/docs/_media+'     -e 's+\.\./tools/LTLSIM+app/tools/LTLSIM+' -e 's+production electron ./app/+production electron --no-sandbox ./app/+' x.json > package.json;
rm x.json;
mv webpack.config.base.js x.js;
sed -e 's+docs/_media+app/docs/_media+' x.js > webpack.config.base.js;
rm x.js;
cd app/tools/LTLSIM/ltlsim-core;
npm install;
cd -
npm install;

npm run build;

export PATH=`pwd`/app/tools/LTLSIM/ltlsim-core/simulator:$PATH;
npm start;
cd app

#install electron-packager if you don't have it
#npm install -g electron-packager (may need root permissions)
#Notice that electron-packager will package FRET based on the OS that you are running it. For more options check here: https://electron.github.io/electron-packager/master/

electron-packager .

# Alternatively, you can do the following (notice that you need to run electron-packager with npx):
# npm install -D electron-packager
# npx electron-packager .

tar zcvf ~/Desktop/FRET-linux-x64.tgz FRET-linux-x64/
