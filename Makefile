loc:
	cloc js index.html

pages:
	scp -r ../bio wreardan@pages.discovery.wisc.edu:~/public_html

pages_test:
	#scp -r ../bio wreardan@pages.discovery.wisc.edu:~/public_html/test
	rsync -avz --exclude='.git/' . wreardan@pages.discovery.wisc.edu:~/public_html/test

sushmita:
	rsync -avz --exclude='.git/' . sroy@pages.discovery.wisc.edu:~/public_html/visualizations

precompute_influenza:
	time node ./js/node_force_directed.js ./influenza/human/edgec_0.3.txt ./influenza/human/clusterassign.txt ./influenza/human/force_directed_positions.txt
	time node ./js/node_force_directed.js ./influenza/mouse/edgec_0.3.txt ./influenza/mouse/clusterassign.txt ./influenza/mouse/force_directed_positions.txt

precompute_cancer:
	time node ./js/node_force_directed.js ./cancer/data/BRCA.filtered.net ./cancer/data/BRCA_0.3_clusterassign.txt ./cancer/data/BRCA_positions.txt
	time node ./js/node_force_directed.js ./cancer/data/COAD.filtered.net ./cancer/data/COAD_0.3_clusterassign.txt ./cancer/data/COAD_positions.txt
	time node ./js/node_force_directed.js ./cancer/data/KIRC.filtered.net ./cancer/data/KIRC_0.3_clusterassign.txt ./cancer/data/KIRC_positions.txt
	time node ./js/node_force_directed.js ./cancer/data/LUSC.filtered.net ./cancer/data/LUSC_0.3_clusterassign.txt ./cancer/data/LUSC_positions.txt
	time node ./js/node_force_directed.js ./cancer/data/OV.filtered.net ./cancer/data/OV_0.3_clusterassign.txt ./cancer/data/OV_positions.txt
	time node ./js/node_force_directed.js ./cancer/data/UCEC.filtered.net ./cancer/data/UCEC_0.3_clusterassign.txt ./cancer/data/UCEC_positions.txt

precompute_plants:
	time node ./js/node_force_directed.js ./plants/edges_in_modules_with_regs.txt ./plants/allmodules.txt ./plants/force_directed_positions.txt