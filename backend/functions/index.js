const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Create and deploy your first Cloud Function
exports.createProject = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).send("");
    return;
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { title, description, imageUrl, status, sections } = req.body;
    
    // Input validation
    if (!title || !description || !imageUrl) {
      return res.status(400).json({ 
        error: "Missing required fields: title, description, and imageUrl are required" 
      });
    }

    // Get all active sections from Firestore
    const sectionsSnapshot = await admin
      .firestore()
      .collection("sections_config")
      .where("isActive", "==", true)
      .get();
      
    const validSections = sectionsSnapshot.docs.map(doc => doc.id);
    
    // Add default sections if not already included
    if (!validSections.includes('recent')) validSections.push('recent');
    if (!validSections.includes('featured')) validSections.push('featured');
    
    // Validate sections if provided
    if (sections && Array.isArray(sections)) {
      const invalidSections = sections.filter(section => !validSections.includes(section));
      if (invalidSections.length > 0) {
        return res.status(400).json({ 
          error: `Invalid sections: ${invalidSections.join(', ')}. Valid sections are: ${validSections.join(', ')}` 
        });
      }
    } else if (sections) {
      return res.status(400).json({
        error: "Sections must be an array"
      });
    }

    // Prepare project data
const projectData = {
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      status: (status && status.trim()) || "active",
      sections: sections || ["recent"], // Default to recent section
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add to Firestore
    const docRef = await admin
      .firestore()
      .collection("projects")
      .add(projectData);

    // Return success response
    return res.status(201).json({
      success: true,
      id: docRef.id,
      ...projectData
    });

  } catch (error) {
    console.error("Error in createProject function:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
});

// Update project function for editing sections
exports.updateProject = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "PUT, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).send("");
    return;
  }

  // Only accept PUT requests
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id, title, description, imageUrl, status, sections } = req.body;
    
    // Input validation
    if (!id) {
      return res.status(400).json({ 
        error: "Project ID is required" 
      });
    }

    // Get all active sections from Firestore if sections are being updated
    if (sections) {
      const sectionsSnapshot = await admin
        .firestore()
        .collection("sections_config")
        .where("isActive", "==", true)
        .get();
        
      const validSections = sectionsSnapshot.docs.map(doc => doc.id);
      
      // Add default sections if not already included
      if (!validSections.includes('recent')) validSections.push('recent');
      if (!validSections.includes('featured')) validSections.push('featured');
      
      // Validate sections
      if (!Array.isArray(sections)) {
        return res.status(400).json({
          error: "Sections must be an array"
        });
      }
      
      const invalidSections = sections.filter(section => !validSections.includes(section));
      if (invalidSections.length > 0) {
        return res.status(400).json({ 
          error: `Invalid sections: ${invalidSections.join(', ')}. Valid sections are: ${validSections.join(', ')}` 
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only update fields that are provided
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (imageUrl) updateData.imageUrl = imageUrl.trim();
    if (status) updateData.status = status.trim();
    if (sections) updateData.sections = sections;

    // Update in Firestore
    await admin
      .firestore()
      .collection("projects")
      .doc(id)
      .update(updateData);

    // Return success response
    return res.status(200).json({
      success: true,
      id,
      ...updateData
    });
  } catch (error) {
    console.error("Error in updateProject function:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Get all sections configuration
exports.getSections = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).send("");
    return;
  }

  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sectionsSnapshot = await admin
      .firestore()
      .collection("sections_config")
      .get();

    let sections = sectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      order: doc.data().order || 999, // Default to 999 if order is not set
      ...doc.data()
    }));

    // Sort sections by order, then by name for items with the same order
    sections.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    console.log('Returning sections in order:', sections.map(s => ({ id: s.id, name: s.name, order: s.order })));
    return res.status(200).json({ sections });

  } catch (error) {
    console.error("Error in getSections function:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Create new section
exports.createSection = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).send("");
    return;
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { name, order } = req.body;

    // Input validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Section name is required"
      });
    }

    // Check if section name already exists
    const existingSection = await admin
      .firestore()
      .collection("sections_config")
      .where("name", "==", name.trim())
      .get();

    if (!existingSection.empty) {
      return res.status(400).json({
        error: "Section name already exists"
      });
    }

    // Get the highest order number to set default order
    const sectionsSnapshot = await admin
      .firestore()
      .collection("sections_config")
      .orderBy("order", "desc")
      .limit(1)
      .get();

    const nextOrder = sectionsSnapshot.empty ? 0 : (sectionsSnapshot.docs[0].data().order + 1);

    // Prepare section data
    const sectionData = {
      name: name.trim(),
      order: order !== undefined ? order : nextOrder,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Add to Firestore
    const docRef = await admin
      .firestore()
      .collection("sections_config")
      .add(sectionData);

    return res.status(201).json({
      success: true,
      id: docRef.id,
      ...sectionData
    });

  } catch (error) {
    console.error("Error in createSection function:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Update section
exports.updateSection = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "PUT, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).send("");
    return;
  }

  // Only accept PUT requests
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id, name, order, isActive } = req.body;

    // Input validation
    if (!id) {
      return res.status(400).json({
        error: "Section ID is required"
      });
    }

    // Check if section exists
    const sectionDoc = await admin
      .firestore()
      .collection("sections_config")
      .doc(id)
      .get();

    if (!sectionDoc.exists) {
      return res.status(404).json({
        error: "Section not found"
      });
    }

    // If name is being changed, check if it already exists
    if (name && name.trim() !== sectionDoc.data().name) {
      const existingSection = await admin
        .firestore()
        .collection("sections_config")
        .where("name", "==", name.trim())
        .get();

      if (!existingSection.empty) {
        return res.status(400).json({
          error: "Section name already exists"
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only update fields that are provided
    if (name) updateData.name = name.trim();
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update in Firestore
    await admin
      .firestore()
      .collection("sections_config")
      .doc(id)
      .update(updateData);

    return res.status(200).json({
      success: true,
      id,
      ...updateData
    });

  } catch (error) {
    console.error("Error in updateSection function:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});

// Delete section
exports.deleteSection = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(204).send("");
    return;
  }

  // Only accept DELETE requests
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id } = req.body;

    // Input validation
    if (!id) {
      return res.status(400).json({
        error: "Section ID is required"
      });
    }

    // Check if section exists
    const sectionDoc = await admin
      .firestore()
      .collection("sections_config")
      .doc(id)
      .get();

    if (!sectionDoc.exists) {
      return res.status(404).json({
        error: "Section not found"
      });
    }

    // Check if any projects are using this section
    const projectsUsingSection = await admin
      .firestore()
      .collection("projects")
      .where("sections", "array-contains", id)
      .get();

    if (!projectsUsingSection.empty) {
      return res.status(400).json({
        error: "Cannot delete section that is being used by projects. Please remove this section from all projects first."
      });
    }

    // Delete from Firestore
    await admin
      .firestore()
      .collection("sections_config")
      .doc(id)
      .delete();

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully"
    });

  } catch (error) {
    console.error("Error in deleteSection function:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
});
