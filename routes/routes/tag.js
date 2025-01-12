const Tag = require("../../models/tag");
const multer = require("multer");
const path = require("path");
const PORT = 3007;
const express = require('express');
const router = express.Router();

// const routes = function (app) {
    router.get('/tag', async function(req,res){
		try{
			let tag = await Tag.find().populate('post').lean()
			console.log('Populated tags with posts:', tag);
			res.json(tag)
		}catch(err){
			res.status(500).send(err.msg)
		}
	});
	  
	router.get('/tag/:id', async function(req,res){
		try{
		 let {id} = req.params
		 let tag = await Tag.findById(id).populate('post');

		 if (!tag) {
			return res.status(404).json({ msg: 'Tag not found' });
		  }
	  
		//   console.log('Fetched tag:', tag);

		 let data = {
			 title: tag.title,
			 id:tag.id,
			 post: tag.post
		 }
		 // console.log(category)
		 res.json(data)
		}catch(err){
			console.error('Error fetching tag:', err);
		    res.status(500).send({msg:"server error"})
		}
	 })

	router.put('/tag/:id', async function(req,res){
		try{
			let {id} = req.params
			let tag = await Tag.findById(id)
            let new_data = {}

            if (!tag)
            return res.status(404).json({msg: "tag does not exist", code:404});

            new_data = {...tag._doc, ...req.body};

            tag.overwrite(new_data);
            await tag.save();

            res.json(tag)
		}catch(err){
			res.status(500).send(err.msg)
		}
	});
    
    router.delete('/tag/:id', async function(req,res){
		try{
			let {id} = req.params
			let tag = await Tag.findOneAndDelete({ _id: id })

			if (!tag) {
				return res.status(404).json({ msg: "Tag does not exist", code: 404 });
			  }
		  
			  res.json({ msg: "Tag deleted" });
			} catch (err) {
			  res.status(500).send(err.msg);
			}
	});

	router.post('/tag', async (req, res) => {
		try {
		  const tagData = req.body;
		  if (typeof tagData.name === 'string' && tagData.name.startsWith('{') && tagData.name.endsWith('}')) {
			try {
			  const parsedTitle = JSON.parse(tagData.name);
			  tagData.name = parsedTitle.name; // Assuming "name" is the property for the actual title
			} catch (err) {
			  // Handle parsing error (optional)
			}
		  }
	  
		  const tag = new Tag(tagData);
		  await tag.save();
		  res.json(tag);
		} catch (err) {
		  res.status(500).send(err.msg);
		}
	  });
	  
 
// }
module.exports = router
